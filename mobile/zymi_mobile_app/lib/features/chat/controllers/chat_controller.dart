import 'package:flutter/foundation.dart';
import '../models/zymi_message.dart';
import '../storage/chat_local_cache.dart';
import '../services/chat_history_service.dart';
import '../services/offline_message_queue.dart';
import '../../../services/realtime/zymi_socket_client.dart';
import '../../../services/realtime/zymi_chat_socket_service.dart';
import '../../../services/realtime/zymi_chat_payloads.dart';
import '../../../services/socket/message_socket_service.dart';
import '../../../services/media/media_index_service.dart';
import '../../../services/media/media_data_channel_service.dart';
import '../../../services/media/media_chunk_service.dart';
import '../../../core/local_db/local_media_database.dart';
import '../../../core/local_db/local_media_record.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'dart:io';
import '../../../services/api/auth_service.dart';

class ChatController extends ChangeNotifier {
  String? selectedUserId;
  String currentUserId;
  final List<ZymiMessage> messages = [];
  bool isLoadingHistory = false;
  String? peerTypingId;
  int totalUnreadCount = 0;

  ChatController({required this.currentUserId});

  String get _conversationId {
    if (selectedUserId == null) return '';
    final ids = [int.parse(currentUserId), int.parse(selectedUserId!)];
    ids.sort();
    return ids.join('_');
  }

  void init() {
    final chatService = ZymiChatSocketService();
    final msgSocketService = MessageSocketService();

    chatService.listenReceiveMessage((data) {
      if (data is Map<String, dynamic>) {
        _addIncoming(data);
      }
    });

    chatService.listenNewMessage((data) {
      if (data is Map<String, dynamic>) {
        _addIncoming(data);
      }
    });

    msgSocketService.listenPendingMessages((list) {
      for (var data in list) {
        if (data is Map<String, dynamic>) {
          _addIncoming(data);
        }
      }
    });

    msgSocketService.listenUnreadUpdate((data) {
      totalUnreadCount = data['total'] ?? 0;
      notifyListeners();
    });

    chatService.listenMessageSent((data) {
      if (data is Map<String, dynamic>) {
        final tempId = data['tempId']?.toString();
        final serverId = data['id'];
        if (tempId != null) {
          final idx = messages.indexWhere((m) => m.tempId == tempId);
          if (idx != -1) {
            messages[idx] = messages[idx].copyWith(
                status: 'sent', id: serverId is int ? serverId : null);
            notifyListeners();
            _persistCache();
          }
        }
      }
    });

    chatService.listenUserTyping((data) {
      peerTypingId = data?['from']?.toString();
      notifyListeners();
    });

    chatService.listenUserStopTyping((data) {
      if (peerTypingId == data?['from']?.toString()) {
        peerTypingId = null;
        notifyListeners();
      }
    });

    // Listen for delivery/read updates
    ZymiSocketClient().onSafe('message-status-update', (data) {
      if (data is Map<String, dynamic>) {
        final msgId = data['messageId'];
        final status = data['status']?.toString();
        if (msgId != null && status != null) {
          final idx = messages.indexWhere((m) => m.id == msgId);
          if (idx != -1) {
            messages[idx] = messages[idx].copyWith(status: status);
            notifyListeners();
          }
        }
      }
    });

    // Flush offline queue on reconnect
    ZymiSocketClient().statusStream.listen((status) {
      if (status == ZymiSocketStatus.connected) {
        _flushOfflineQueue();
      }
    });

    // Phase 58: Media Signaling Listeners
    ZymiSocketClient().onSafe('media-transfer-offer', (data) {
      _handleMediaOffer(data);
    });

    ZymiSocketClient().onSafe('media-transfer-accept', (data) {
      _handleMediaAccept(data);
    });

    ZymiSocketClient().onSafe('media-transfer-progress', (data) {
      _handleMediaProgress(data);
    });

    ZymiSocketClient().onSafe('media-transfer-completed', (data) {
      _handleMediaCompleted(data);
    });
  }

  final Map<String, MediaDataChannelService> _activeTransfers = {};

  void _handleMediaOffer(dynamic data) async {
    if (data is Map<String, dynamic>) {
      final from = data['from'];
      final fileId = data['fileId'];
      final metadata = data['metadata'];

      // Auto-accept for now or show prompt. Prompt is better but for MVP we auto-accept metadata sync.
      final service = MediaDataChannelService(
          peerId: from, fileId: fileId, isSender: false);
      _activeTransfers[fileId] = service;

      final chunks = <List<int>>[];
      service.onMessage.listen((chunk) {
        if (chunk is List<int>) chunks.add(chunk);
      });

      service.onStateChange.listen((state) async {
        if (state == RTCDataChannelState.RTCDataChannelOpen) {
          // Ready to receive
        }
      });

      final token = await AuthService().getToken() ?? '';
      await service.init(token: token);
      await service.acceptOffer(metadata);
    }
  }

  void _handleMediaAccept(dynamic data) async {
    if (data is Map<String, dynamic>) {
      final fileId = data['fileId'];
      final signalData = data['signalData'];
      final service = _activeTransfers[fileId];
      if (service != null) {
        await service.handleAnswer(signalData);
      }
    }
  }

  void _handleMediaProgress(dynamic data) {
    // Update UI progress
  }

  void _handleMediaCompleted(dynamic data) {
    if (data is Map<String, dynamic>) {
      final fileId = data['fileId'];
      _updateMessageMediaStatus(fileId, 'completed');
    }
  }

  void _updateMessageMediaStatus(String fileId, String status) {
    final idx =
        messages.indexWhere((m) => m.mediaMetadata?['file_id'] == fileId);
    if (idx != -1) {
      messages[idx] = messages[idx].copyWith(mediaMetadata: {
        ...?messages[idx].mediaMetadata,
        'transfer_status': status
      });
      notifyListeners();
    }
  }

  Future<void> sendMedia(String path, String type) async {
    if (selectedUserId == null) return;

    final file = File(path);
    final fileName = path.split('/').last;
    final fileSize = await file.length();
    final fileId = DateTime.now().millisecondsSinceEpoch.toString();

    // 1. Index locally
    final record = LocalMediaRecord(
      fileId: fileId,
      conversationId: _conversationId,
      senderId: currentUserId,
      receiverId: selectedUserId!,
      mediaType: type,
      localPath: path,
      fileName: fileName,
      fileSize: fileSize,
      mimeType: type == 'image' ? 'image/jpeg' : 'application/octet-stream',
      transferStatus: 'pending',
      createdAt: DateTime.now(),
    );
    await LocalMediaDatabase.saveRecord(record);

    // 2. Send metadata message
    final tempId = 'media_$fileId';
    final msg = ZymiMessage(
        tempId: tempId,
        senderId: currentUserId,
        receiverId: selectedUserId!,
        content: 'Shared $type',
        type: 'media',
        status: 'sending',
        createdAt: DateTime.now(),
        isMine: true,
        mediaMetadata: {
          'file_id': fileId,
          'file_name': fileName,
          'file_size': fileSize,
          'media_type': type,
          'transfer_status': 'pending',
        });
    messages.add(msg);
    notifyListeners();

    // 3. Index on server
    try {
      final token = await AuthService().getToken() ?? '';
      await MediaIndexService.indexMediaOnServer({
        'message_id': 0, // Will be updated
        'conversation_id': _conversationId,
        'receiver_id': int.parse(selectedUserId!),
        'media_type': type,
        'file_id': fileId,
        'file_name': fileName,
        'file_size': fileSize,
        'mime_type': record.mimeType,
        'checksum': 'pending',
      }, token);

      if (ZymiSocketClient().isConnected) {
        final service = MediaDataChannelService(
            peerId: selectedUserId!, fileId: fileId, isSender: true);
        _activeTransfers[fileId] = service;
        final token = await AuthService().getToken() ?? '';
        await service.init(token: token);

        service.onStateChange.listen((state) async {
          if (state == RTCDataChannelState.RTCDataChannelOpen) {
            _startTransfer(fileId, path, service);
          }
        });
      }
    } catch (e) {
      debugPrint('Media indexing failed: $e');
    }
  }

  void _startTransfer(
      String fileId, String path, MediaDataChannelService service) async {
    _updateMessageMediaStatus(fileId, 'transferring');
    final chunks = MediaChunkService.readFileInChunks(path);
    await for (final chunk in chunks) {
      await service.sendChunk(chunk);
    }
    ZymiSocketClient().emitSafe(
        'media-transfer-completed', {'to': selectedUserId, 'fileId': fileId});
    _updateMessageMediaStatus(fileId, 'completed');
    await LocalMediaDatabase.updateStatus(fileId, 'completed');
  }

  void _addIncoming(Map<String, dynamic> data) {
    final msg = ZymiMessage.fromJson(data, currentUserId);
    // Deduplicate by id or tempId
    if (msg.id != null && messages.any((m) => m.id == msg.id)) return;
    if (msg.tempId != null && messages.any((m) => m.tempId == msg.tempId)) {
      return;
    }

    messages.add(msg);
    notifyListeners();
    _persistCache();

    // If message is for current open conversation, mark as read
    if (selectedUserId == msg.senderId) {
      _markCurrentAsRead();
    }
  }

  Future<void> _markCurrentAsRead() async {
    // In a real implementation we'd call the API
  }

  Future<void> loadHistory({String? token}) async {
    if (selectedUserId == null) return;
    isLoadingHistory = true;
    notifyListeners();

    // Try local cache first
    final cached = await ChatLocalCache.loadMessages(_conversationId);
    if (cached.isNotEmpty) {
      for (final raw in cached) {
        final msg = ZymiMessage.fromJson(raw, currentUserId);
        if (!messages.any((m) => m.id == msg.id && m.id != null)) {
          messages.add(msg);
        }
      }
      notifyListeners();
    }

    // Then fetch from server
    try {
      final history = await ChatHistoryService.fetchHistory(
          currentUserId, selectedUserId!,
          token: token);
      for (final raw in history) {
        final msg = ZymiMessage.fromJson(raw, currentUserId);
        if (!messages.any((m) => m.id == msg.id && m.id != null)) {
          messages.add(msg);
        }
      }
    } catch (e) {
      debugPrint('History fetch failed: $e');
    }

    // Sort by time
    messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));

    isLoadingHistory = false;
    notifyListeners();
    _persistCache();
  }

  void sendMessage(String content) {
    if (selectedUserId == null || content.isEmpty) return;

    final tempId = DateTime.now().millisecondsSinceEpoch.toString();
    final msg = ZymiMessage(
      tempId: tempId,
      senderId: currentUserId,
      receiverId: selectedUserId!,
      content: content,
      status: 'sending',
      createdAt: DateTime.now(),
      isMine: true,
    );
    messages.add(msg);
    notifyListeners();

    if (ZymiSocketClient().isConnected) {
      ZymiChatSocketService().sendPrivateMessage(PrivateMessagePayload(
        to: selectedUserId!,
        from: currentUserId,
        content: content,
        tempId: tempId,
      ));
    } else {
      // Queue for later
      OfflineMessageQueue.enqueue({
        'to': selectedUserId,
        'from': currentUserId,
        'content': content,
        'tempId': tempId,
        'delivery_status': 'queued'
      });
      final idx = messages.indexWhere((m) => m.tempId == tempId);
      if (idx != -1) {
        messages[idx] = messages[idx].copyWith(status: 'queued');
        notifyListeners();
      }
    }
  }

  void retryMessage(String tempId) {
    final idx = messages.indexWhere((m) =>
        m.tempId == tempId && (m.status == 'failed' || m.status == 'queued'));
    if (idx == -1) return;

    final msg = messages[idx];
    messages[idx] = msg.copyWith(status: 'sending');
    notifyListeners();

    if (ZymiSocketClient().isConnected) {
      ZymiChatSocketService().sendPrivateMessage(PrivateMessagePayload(
        to: msg.receiverId,
        from: msg.senderId,
        content: msg.content,
        tempId: tempId,
      ));
    }
  }

  Future<void> _flushOfflineQueue() async {
    final queued = await OfflineMessageQueue.dequeueAll();
    for (final raw in queued) {
      final tempId = raw['tempId']?.toString();
      if (tempId != null && messages.any((m) => m.tempId == tempId)) {
        ZymiChatSocketService().sendPrivateMessage(PrivateMessagePayload(
          to: raw['to'] ?? '',
          from: raw['from'] ?? '',
          content: raw['content'] ?? '',
          tempId: tempId,
        ));
        final idx = messages.indexWhere((m) => m.tempId == tempId);
        if (idx != -1) {
          messages[idx] = messages[idx].copyWith(status: 'sending');
        }
      }
    }
    notifyListeners();
  }

  Future<void> _persistCache() async {
    if (selectedUserId == null) return;
    final jsonList = messages.map((m) => m.toJson()).toList();
    await ChatLocalCache.saveMessages(_conversationId, jsonList);
  }
}

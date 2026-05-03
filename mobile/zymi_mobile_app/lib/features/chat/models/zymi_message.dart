class ZymiMessage {
  final int? id;
  final String? tempId;
  final String senderId;
  final String receiverId;
  final String content;
  final String type;
  final String status; // sending, sent, delivered, read, failed
  final DateTime createdAt;
  final bool isMine;
  final Map<String, dynamic>? metadata;
  final Map<String, dynamic>? mediaMetadata;

  ZymiMessage({
    this.id,
    this.tempId,
    required this.senderId,
    required this.receiverId,
    required this.content,
    this.type = 'text',
    this.status = 'sending',
    required this.createdAt,
    required this.isMine,
    this.metadata,
    this.mediaMetadata,
  });

  ZymiMessage copyWith({String? status, int? id, Map<String, dynamic>? mediaMetadata}) {
    return ZymiMessage(
      id: id ?? this.id,
      tempId: tempId,
      senderId: senderId,
      receiverId: receiverId,
      content: content,
      type: type,
      status: status ?? this.status,
      createdAt: createdAt,
      isMine: isMine,
      metadata: metadata,
      mediaMetadata: mediaMetadata ?? this.mediaMetadata,
    );
  }

  factory ZymiMessage.fromJson(Map<String, dynamic> json, String currentUserId) {
    return ZymiMessage(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      tempId: json['tempId']?.toString() ?? json['client_message_id']?.toString(),
      senderId: json['sender_id']?.toString() ?? '',
      receiverId: json['receiver_id']?.toString() ?? '',
      content: json['content']?.toString() ?? json['message_text']?.toString() ?? '',
      type: json['message_type']?.toString() ?? 'text',
      status: json['delivery_status']?.toString() ?? json['status']?.toString() ?? 'sent',
      createdAt: DateTime.tryParse(json['timestamp']?.toString() ?? json['created_at']?.toString() ?? '') ?? DateTime.now(),
      isMine: json['sender_id']?.toString() == currentUserId,
      metadata: json['metadata'] as Map<String, dynamic>?,
      mediaMetadata: json['media_metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tempId': tempId,
      'sender_id': senderId,
      'receiver_id': receiverId,
      'content': content,
      'message_type': type,
      'status': status,
      'timestamp': createdAt.toIso8601String(),
      'media_metadata': mediaMetadata,
    };
  }
}

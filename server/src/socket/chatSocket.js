import { SOCKET_EVENTS } from '../../shared/socketEvents.js';
import { get, all, run } from '../db/database.js';
import { incrementMessagesToday, incrementTypingEvents, incrementDisconnects } from '../services/metricsService.js';
import { shouldBroadcastOnline } from '../services/presenceService.js';
import { getUserSocketRegistry } from './userSocketRegistry.js';
import { cleanupUserActiveCall } from './callState.js';
import * as messageQueueService from '../services/messageQueueService.js';
import * as unreadCounterService from '../services/unreadCounterService.js';
import * as inAppNotificationService from '../services/inAppNotificationService.js';

const checkToken = (socket, userId) => {
  try {
    if (!userId) return true; // Skip check if no userId
    const user = get('SELECT token_version FROM users WHERE id = ?', userId);
    if (user && socket.tokenVersion !== user.token_version) {
      return false;
    }
    return true;
  } catch (err) {
    console.error('[CHAT_SOCKET] checkToken error:', err);
    return true; // Allow connection on DB failure to prevent crashes
  }
};

export const setupChatSocket = (io, userSockets) => {
  io.on('connection', (socket) => {
    console.log('[SOCKET] User connected:', socket.id);

    socket.on(SOCKET_EVENTS.JOIN, (userId) => {
      try {
        if (!userId) return;

        // Normalize userId to string for consistent Map lookups
        const normalizedUserId = String(userId);
        console.log('[SOCKET] JOIN received:', userId, '-> normalized:', normalizedUserId);

        const user = get('SELECT is_banned, role, token_version, online_visibility FROM users WHERE id = ?', normalizedUserId);

        if (user && user.is_banned) {
          socket.emit(SOCKET_EVENTS.BANNED, { reason: 'Your account has been suspended' });
          socket.disconnect();
          return;
        }

        socket.userId = normalizedUserId;
        socket.userRole = user?.role || 'user';
        socket.tokenVersion = user?.token_version || 1;
        socket.onlineVisibility = user?.online_visibility !== false; // default true

        // Phase 63: Multi-tab support - join room and set map
        socket.join(normalizedUserId);
        userSockets.set(normalizedUserId, socket.id);

        // Phase 57: Sync pending messages when user joins
        const pendingMessages = messageQueueService.getPendingMessages(normalizedUserId);
        if (pendingMessages.length > 0) {
          socket.emit('sync-pending-messages', pendingMessages);
          // Mark as delivered once emitted
          messageQueueService.markMessagesAsDelivered(normalizedUserId);
        }

        // Sync unread count
        const unreadTotal = unreadCounterService.getTotalUnread(normalizedUserId);
        socket.emit('unread-count-updated', { total: unreadTotal });

        // Shadow write to Redis registry (dev-only)
        if (process.env.REDIS_SOCKET_REGISTRY_SHADOW === 'true' && process.env.NODE_ENV !== 'production') {
          try {
            const registry = getUserSocketRegistry();
            registry.setUserSocket(userId, socket.id);
          } catch (error) {
            console.error('[JOIN] Shadow write failed:', error.message);
          }
        }

        // Only broadcast online status if visibility is enabled
        if (shouldBroadcastOnline(userId)) {
          socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, { userId: String(userId) });
        }

        console.log('[SOCKET] User joined:', userId);
      } catch (err) {
        console.error('[CHAT_SOCKET] JOIN error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.PRIVATE_MESSAGE, async (data) => {
      try {
        let { to, from, content, tempId, message_type, file_url, file_name, file_size, mime_type, location_lat, location_lng } = data || {};

        // Normalize IDs to string for consistent lookups
        to = String(to);
        from = String(from);

        if (!to || !from) return;

        // Token version check
        if (!socket.tokenVersion || !checkToken(socket, socket.userId)) {
          socket.disconnect();
          return;
        }

        const targetUser = get('SELECT is_banned, username FROM users WHERE id = ?', to);
        if (targetUser?.is_banned) return;

        // Phase 57: Conversation ID logic (smaller_greater)
        const ids = [from, to].sort((a, b) => parseInt(a) - parseInt(b));
        const conversationId = ids.join('_');

        // Build message content - fallback to type description if media
        const messageContent = content || (message_type === 'location' ? 'Shared location' : 'Media');

        const targetSocketId = userSockets.get(to);
        const isOnline = !!targetSocketId;

        // Phase 57: Store message with delivery status
        const messageId = messageQueueService.enqueueMessage({
          sender_id: from,
          receiver_id: to,
          content: messageContent,
          message_type: message_type || 'text',
          client_message_id: tempId,
          conversation_id: conversationId,
          delivery_status: isOnline ? 'sent' : 'queued'
        });

        const message = {
          id: messageId,
          sender_id: from,
          receiver_id: to,
          content: messageContent,
          message_text: messageContent,
          message_type: message_type || 'text',
          file_url,
          file_name,
          file_size,
          mime_type,
          location_lat,
          location_lng,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          tempId,
          conversation_id: conversationId,
          delivery_status: isOnline ? 'sent' : 'queued'
        };

        // Emit back to sender
        io.to(socket.id).emit(SOCKET_EVENTS.NEW_MESSAGE, message);
        io.to(socket.id).emit('message-sent', { tempId, id: message.id });

        if (isOnline) {
          io.to(targetSocketId).emit(SOCKET_EVENTS.NEW_MESSAGE, { ...message, tempId: undefined });
          io.to(targetSocketId).emit('receive_message', { ...message, tempId: undefined });
        } else {
          // Phase 57: Notification for offline user
          const sender = get('SELECT username FROM users WHERE id = ?', from);
          inAppNotificationService.createNotification({
            user_id: to,
            type: 'message',
            title: `New message from ${sender?.username || 'Unknown'}`,
            body: messageContent.length > 50 ? messageContent.substring(0, 47) + '...' : messageContent,
            related_user_id: from,
            related_conversation_id: conversationId
          });
          
          // Increment unread for offline user
          unreadCounterService.incrementUnread(to, conversationId);
        }

        incrementMessagesToday();
      } catch (err) {
        console.error('[CHAT_SOCKET] PRIVATE_MESSAGE error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.TYPING, (data) => {
      try {
        const { to, from } = data || {};
        if (!to) return;

        const targetSocketId = userSockets.get(String(to)) || userSockets.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit(SOCKET_EVENTS.USER_TYPING, { from: String(from) });
        }
        incrementTypingEvents();
      } catch (err) {
        console.error('[CHAT_SOCKET] TYPING error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, (data) => {
      try {
        const { to, from } = data || {};
        if (!to) return;

        const targetSocketId = userSockets.get(String(to)) || userSockets.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit(SOCKET_EVENTS.USER_STOP_TYPING, { from: String(from) });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] STOP_TYPING error:', err);
      }
    });

    socket.on('message-delivered', (data) => {
      try {
        const { messageId, senderId, receiverId } = data || {};
        if (!messageId || !senderId) return;
        
        const senderSocketId = userSockets.get(String(senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-status-update', { messageId, status: 'delivered', receiverId });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] message-delivered error:', err);
      }
    });

    socket.on('message-read', (data) => {
      try {
        const { messageId, senderId, receiverId } = data || {};
        if (!messageId || !senderId) return;
        
        run('UPDATE messages SET is_read = 1 WHERE id = ?', messageId);
        
        const senderSocketId = userSockets.get(String(senderId));
        if (senderSocketId) {
          io.to(senderSocketId).emit('message-status-update', { messageId, status: 'read', receiverId });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] message-read error:', err);
      }
    });

    // Phase 58: Media Transfer Signaling
    socket.on('media-transfer-offer', (data) => {
      try {
        const { to, fileId, metadata } = data || {};
        if (!to || !fileId) return;
        const targetSocketId = userSockets.get(String(to));
        if (targetSocketId) {
          io.to(targetSocketId).emit('media-transfer-offer', { from: socket.userId, fileId, metadata });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] media-transfer-offer error:', err);
      }
    });

    socket.on('media-transfer-accept', (data) => {
      try {
        const { to, fileId, signalData } = data || {};
        if (!to || !fileId) return;
        const targetSocketId = userSockets.get(String(to));
        if (targetSocketId) {
          io.to(targetSocketId).emit('media-transfer-accept', { from: socket.userId, fileId, signalData });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] media-transfer-accept error:', err);
      }
    });

    socket.on('media-transfer-ready', (data) => {
      try {
        const { to, fileId } = data || {};
        const targetSocketId = userSockets.get(String(to));
        if (targetSocketId) {
          io.to(targetSocketId).emit('media-transfer-ready', { from: socket.userId, fileId });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] media-transfer-ready error:', err);
      }
    });

    socket.on('media-transfer-progress', (data) => {
      try {
        const { to, fileId, progress } = data || {};
        const targetSocketId = userSockets.get(String(to));
        if (targetSocketId) {
          io.to(targetSocketId).emit('media-transfer-progress', { from: socket.userId, fileId, progress });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] media-transfer-progress error:', err);
      }
    });

    socket.on('media-transfer-completed', (data) => {
      try {
        const { to, fileId } = data || {};
        const targetSocketId = userSockets.get(String(to));
        if (targetSocketId) {
          io.to(targetSocketId).emit('media-transfer-completed', { from: socket.userId, fileId });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] media-transfer-completed error:', err);
      }
    });

    socket.on('media-transfer-failed', (data) => {
      try {
        const { to, fileId, reason } = data || {};
        const targetSocketId = userSockets.get(String(to));
        if (targetSocketId) {
          io.to(targetSocketId).emit('media-transfer-failed', { from: socket.userId, fileId, reason });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] media-transfer-failed error:', err);
      }
    });

    socket.on('media-transfer-cancelled', (data) => {
      try {
        const { to, fileId } = data || {};
        const targetSocketId = userSockets.get(String(to));
        if (targetSocketId) {
          io.to(targetSocketId).emit('media-transfer-cancelled', { from: socket.userId, fileId });
        }
      } catch (err) {
        console.error('[CHAT_SOCKET] media-transfer-cancelled error:', err);
      }
    });

    socket.on('disconnect', async () => {
      try {
        if (socket.userId) {
          const userId = socket.userId;
          
          // Phase 63: Check if user has other active connections before marking offline
          const remainingSockets = await io.in(userId).fetchSockets();
          
          if (remainingSockets.length === 0) {
            userSockets.delete(userId);

            // Clean up any active call for this user
            cleanupUserActiveCall(userId, io, userSockets);

            // Shadow delete from Redis registry (dev-only)
            if (process.env.REDIS_SOCKET_REGISTRY_SHADOW === 'true' && process.env.NODE_ENV !== 'production') {
              try {
                const registry = getUserSocketRegistry();
                registry.deleteUserSocket(userId);
              } catch (error) {
                console.error('[DISCONNECT] Shadow delete failed:', error.message);
              }
            }

            // Only broadcast offline if user was visible to others
            if (socket.onlineVisibility !== false) {
              socket.broadcast.emit(SOCKET_EVENTS.USER_OFFLINE, { userId: String(userId) });
            }
            incrementDisconnects();
          } else {
            // Update mapping to another active socket for this user
            userSockets.set(userId, remainingSockets[0].id);
          }
        }
        console.log('[SOCKET] User disconnected:', socket.id);
      } catch (err) {
        console.error('[CHAT_SOCKET] disconnect error:', err);
      }
    });

    socket.on('reconnect', () => {
      // On reconnect, a new join event will be emitted by client. We'll update tokenVersion then.
    });
  });
};
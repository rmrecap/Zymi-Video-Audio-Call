import { SOCKET_EVENTS } from '../../shared/socketEvents.js';
import { get } from '../db/postgres.js';
import { incrementMessagesToday } from '../services/metricsService.js';
import { incrementMessagesSent } from '../services/gamificationService.js';
import * as groupChatService from '../services/groupChatService.js';

export const setupGroupChatSocket = (io, userSockets) => {
  io.on('connection', (socket) => {

    socket.on(SOCKET_EVENTS.GROUP_CREATE, async (data) => {
      try {
        const { name, description } = data || {};
        if (!name || !socket.userId) return;
        const group = await groupChatService.createGroup(name, description, socket.userId);
        const members = await groupChatService.getMembers(group.id);
        socket.emit(SOCKET_EVENTS.GROUP_CREATED, { group, members });
        io.emit(SOCKET_EVENTS.GROUP_UPDATED, { group });
      } catch (err) {
        console.error('[GROUP_SOCKET] CREATE error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_MESSAGE, async (data) => {
      try {
        const { groupId, content, message_type, file_url, file_name, file_size, mime_type, tempId } = data || {};
        if (!groupId || !content || !socket.userId) return;
        const msg = await groupChatService.sendGroupMessage(
          groupId, socket.userId, content, message_type,
          { url: file_url, name: file_name, size: file_size, mime: mime_type },
          null, tempId
        );
        // Broadcast to all group members' sockets
        const members = await groupChatService.getMembers(groupId);
        for (const member of members) {
          const memberSocketId = userSockets.get(String(member.id));
          if (memberSocketId) {
            io.to(memberSocketId).emit(SOCKET_EVENTS.GROUP_NEW_MESSAGE, msg);
          }
        }
        io.to(socket.id).emit(SOCKET_EVENTS.GROUP_MESSAGE_SENT, { tempId, id: msg.id });
        incrementMessagesToday();
        incrementMessagesSent(socket.userId);
      } catch (err) {
        console.error('[GROUP_SOCKET] MESSAGE error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_ADD_MEMBER, async (data) => {
      try {
        const { groupId, userId } = data || {};
        if (!groupId || !userId || !socket.userId) return;
        const member = await groupChatService.addMember(groupId, userId, socket.userId);
        socket.emit(SOCKET_EVENTS.GROUP_MEMBER_ADDED, { groupId, member });
        // Notify added user
        const addedSocketId = userSockets.get(String(userId));
        if (addedSocketId) {
          io.to(addedSocketId).emit(SOCKET_EVENTS.GROUP_INVITE, {
            groupId,
            invitedBy: socket.userId
          });
        }
      } catch (err) {
        console.error('[GROUP_SOCKET] ADD_MEMBER error:', err.message);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_REMOVE_MEMBER, async (data) => {
      try {
        const { groupId, userId } = data || {};
        if (!groupId || !userId || !socket.userId) return;
        const result = await groupChatService.removeMember(groupId, userId, socket.userId);
        socket.emit(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, { groupId, userId, result });
        const removedSocketId = userSockets.get(String(userId));
        if (removedSocketId) {
          io.to(removedSocketId).emit(SOCKET_EVENTS.GROUP_MEMBER_REMOVED, { groupId, userId: socket.userId });
        }
      } catch (err) {
        console.error('[GROUP_SOCKET] REMOVE_MEMBER error:', err.message);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_UPDATE, async (data) => {
      try {
        const { groupId, ...updates } = data || {};
        if (!groupId || !socket.userId) return;
        const updated = await groupChatService.updateGroup(groupId, socket.userId, updates);
        // Notify all members
        const members = await groupChatService.getMembers(groupId);
        for (const member of members) {
          const memberSocketId = userSockets.get(String(member.id));
          if (memberSocketId) {
            io.to(memberSocketId).emit(SOCKET_EVENTS.GROUP_UPDATED, { group: updated });
          }
        }
      } catch (err) {
        console.error('[GROUP_SOCKET] UPDATE error:', err.message);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_DELETE, async (data) => {
      try {
        const { groupId } = data || {};
        if (!groupId || !socket.userId) return;
        await groupChatService.deleteGroup(groupId, socket.userId);
        // Notify all members
        const members = await groupChatService.getMembers(groupId);
        for (const member of members) {
          const memberSocketId = userSockets.get(String(member.id));
          if (memberSocketId) {
            io.to(memberSocketId).emit(SOCKET_EVENTS.GROUP_DELETED, { groupId });
          }
        }
      } catch (err) {
        console.error('[GROUP_SOCKET] DELETE error:', err.message);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_TYPING, (data) => {
      try {
        const { groupId, from } = data || {};
        if (!groupId || !from) return;
        socket.to(groupId).emit(SOCKET_EVENTS.GROUP_TYPING, { groupId, from });
      } catch (err) {
        console.error('[GROUP_SOCKET] TYPING error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.GROUP_STOP_TYPING, (data) => {
      try {
        const { groupId, from } = data || {};
        if (!groupId || !from) return;
        socket.to(groupId).emit(SOCKET_EVENTS.GROUP_STOP_TYPING, { groupId, from });
      } catch (err) {
        console.error('[GROUP_SOCKET] STOP_TYPING error:', err);
      }
    });

    socket.on(SOCKET_EVENTS.STATUS_UPDATE, async (data) => {
      try {
        const { status, emoji, expiresAt } = data || {};
        if (!socket.userId) return;
        const { updateUserStatus } = await import('../services/presenceService.js');
        await updateUserStatus(socket.userId, status, emoji, expiresAt);
        io.emit(SOCKET_EVENTS.STATUS_CHANGED, {
          userId: socket.userId,
          status,
          emoji
        });
      } catch (err) {
        console.error('[GROUP_SOCKET] STATUS_UPDATE error:', err);
      }
    });
  });
};

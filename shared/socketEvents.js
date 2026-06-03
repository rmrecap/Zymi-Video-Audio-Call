export const SOCKET_EVENTS = {
  JOIN: 'join',
  PRIVATE_MESSAGE: 'private-message',
  NEW_MESSAGE: 'new-message',
  CALL_USER: 'call-user',
  INCOMING_CALL: 'incoming-call',
  MAKE_ANSWER: 'make-answer',
  CALL_ANSWER: 'call-answer',
  ICE_CANDIDATE: 'ice-candidate',
  END_CALL: 'end-call',
  REJECT_CALL: 'reject-call',
  CALL_ENDED: 'call-ended',
  CALL_REJECTED: 'call-rejected',
  CALL_TIMEOUT: 'call-timeout',
  TYPING: 'typing',
  STOP_TYPING: 'stop-typing',
  USER_TYPING: 'user-typing',
  USER_STOP_TYPING: 'user-stop-typing',
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',
  BANNED: 'banned',
  CALL_FAILED: 'call-failed',
  MESSAGE_SEEN: 'message-seen',
  GROUP_CREATE: 'group-create',
  GROUP_CREATED: 'group-created',
  GROUP_INVITE: 'group-invite',
  GROUP_JOIN: 'group-join',
  GROUP_LEAVE: 'group-leave',
  GROUP_MESSAGE: 'group-message',
  GROUP_MESSAGE_SENT: 'group-message-sent',
  GROUP_NEW_MESSAGE: 'group-new-message',
  GROUP_ADD_MEMBER: 'group-add-member',
  GROUP_REMOVE_MEMBER: 'group-remove-member',
  GROUP_MEMBER_ADDED: 'group-member-added',
  GROUP_MEMBER_REMOVED: 'group-member-removed',
  GROUP_UPDATE: 'group-update',
  GROUP_UPDATED: 'group-updated',
  GROUP_DELETE: 'group-delete',
  GROUP_DELETED: 'group-deleted',
  GROUP_TYPING: 'group-typing',
  GROUP_STOP_TYPING: 'group-stop-typing',
  STATUS_UPDATE: 'status-update',
  STATUS_CHANGED: 'status-changed',
  PRESENCE_BATCH: 'presence-batch',
  GROUP_CALL_START: 'group-call-start',
  GROUP_CALL_STARTED: 'group-call-started',
  GROUP_CALL_JOIN: 'group-call-join',
  GROUP_CALL_JOINED: 'group-call-joined',
  GROUP_CALL_LEAVE: 'group-call-leave',
  GROUP_CALL_LEFT: 'group-call-left',
  GROUP_CALL_END: 'group-call-end',
  GROUP_CALL_ENDED: 'group-call-ended',
  GROUP_CALL_OFFER: 'group-call-offer',
  GROUP_CALL_ANSWER: 'group-call-answer',
  GROUP_CALL_ICE_CANDIDATE: 'group-call-ice-candidate',
  GROUP_CALL_REJECT: 'group-call-reject',
  GROUP_CALL_REJECTED: 'group-call-rejected',
  GROUP_CALL_TIMEOUT: 'group-call-timeout',
  GROUP_CALL_PARTICIPANTS: 'group-call-participants'
};

export const ADMIN_SOCKET_EVENTS = {
  ADMIN_STATS_UPDATE: 'admin-stats-update',
  ADMIN_USER_BANNED: 'admin-user-banned',
  ADMIN_USER_UNBANNED: 'admin-user-unbanned'
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/register',
    LOGIN: '/api/login',
    ADMIN_LOGIN: '/api/admin/login'
  },
  USERS: {
    LIST: '/api/users',
    ADMIN_LIST: '/api/admin/users'
  },
  MESSAGES: {
    GET: '/api/messages/:userId/:otherId',
    SEARCH: '/api/messages/search/:userId',
    READ: '/api/messages/read',
    UNREAD: '/api/unread/:userId'
  },
  ADMIN: {
    STATS: '/api/admin/stats',
    BAN: '/api/admin/ban',
    UNBAN: '/api/admin/unban',
    AUDIT: '/api/admin/audit',
    RISKS: '/api/admin/risks'
  }
};

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support',
  USER: 'user'
};

export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_BAN: 'users.ban',
  USERS_UNBAN: 'users.unban',
  AUDIT_READ: 'audit.read',
  STATS_READ: 'stats.read',
  RISKS_READ: 'risks.read',
  SETTINGS_UPDATE: 'settings.update'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_BAN,
    PERMISSIONS.USERS_UNBAN,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.STATS_READ,
    PERMISSIONS.RISKS_READ
  ],
  [USER_ROLES.MODERATOR]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_BAN,
    PERMISSIONS.USERS_UNBAN
  ],
  [USER_ROLES.SUPPORT]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.AUDIT_READ
  ],
  [USER_ROLES.USER]: []
};

export const LOCKED_SOCKET_EVENTS = [
  SOCKET_EVENTS.JOIN,
  SOCKET_EVENTS.PRIVATE_MESSAGE,
  SOCKET_EVENTS.CALL_USER,
  SOCKET_EVENTS.INCOMING_CALL,
  SOCKET_EVENTS.MAKE_ANSWER,
  SOCKET_EVENTS.CALL_ANSWER,
  SOCKET_EVENTS.ICE_CANDIDATE,
  SOCKET_EVENTS.END_CALL,
  SOCKET_EVENTS.REJECT_CALL,
  SOCKET_EVENTS.TYPING,
  SOCKET_EVENTS.STOP_TYPING,
  SOCKET_EVENTS.GROUP_CREATE,
  SOCKET_EVENTS.GROUP_MESSAGE,
  SOCKET_EVENTS.GROUP_ADD_MEMBER,
  SOCKET_EVENTS.GROUP_REMOVE_MEMBER,
  SOCKET_EVENTS.GROUP_UPDATE,
  SOCKET_EVENTS.GROUP_DELETE
];

export const CALL_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video'
};

export const CALL_STATUS = {
  IDLE: 'idle',
  CALLING: 'calling',
  CONNECTED: 'connected',
  FAILED: 'failed'
};

export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
  OFFLINE: 'offline'
};
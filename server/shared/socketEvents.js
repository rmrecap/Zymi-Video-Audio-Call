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
  FRIEND_REQUEST: 'friend-request-received',
  FRIEND_RESPONSE: 'friend-request-response'
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
  SOCKET_EVENTS.STOP_TYPING
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
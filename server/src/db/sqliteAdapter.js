/**
 * sqliteAdapter.js — DEPRECATED (SQLite removed)
 *
 * This file previously provided a SQLite adapter layer.
 * The application now exclusively uses PostgreSQL.
 *
 * This stub is kept to prevent import resolution errors.
 * All functions throw a clear error at runtime.
 */

const deprecated = (name) => {
  throw new Error(
    `[sqliteAdapter.js] '${name}' is a deprecated SQLite function. ` +
    `Use postgresAdapter.js or postgres.js instead.`
  );
};

export const get = () => deprecated('get');
export const all = () => deprecated('all');
export const run = () => deprecated('run');
export const exec = () => deprecated('exec');
export const prepare = () => deprecated('prepare');
export const getLastInsertRowid = () => deprecated('getLastInsertRowid');
export const userExists = () => deprecated('userExists');
export const getUserById = () => deprecated('getUserById');
export const getUserByUsername = () => deprecated('getUserByUsername');
export const createUser = () => deprecated('createUser');
export const updateUserTokenVersion = () => deprecated('updateUserTokenVersion');
export const createMessage = () => deprecated('createMessage');
export const getMessagesBetweenUsers = () => deprecated('getMessagesBetweenUsers');
export const markMessageAsRead = () => deprecated('markMessageAsRead');
export const hideMessage = () => deprecated('hideMessage');
export const deleteMessage = () => deprecated('deleteMessage');
export const editMessageContent = () => deprecated('editMessageContent');
export const getMessageEdits = () => deprecated('getMessageEdits');
export const searchMessages = () => deprecated('searchMessages');
export const getUnreadCount = () => deprecated('getUnreadCount');
export const createBlock = () => deprecated('createBlock');
export const removeBlock = () => deprecated('removeBlock');
export const isUserBlocked = () => deprecated('isUserBlocked');
export const getBlockedUsers = () => deprecated('getBlockedUsers');
export const createCallHistory = () => deprecated('createCallHistory');
export const updateCallHistory = () => deprecated('updateCallHistory');
export const getCallHistory = () => deprecated('getCallHistory');
export const createReport = () => deprecated('createReport');
export const getReports = () => deprecated('getReports');
export const resolveReport = () => deprecated('resolveReport');
export const createAuditLog = () => deprecated('createAuditLog');
export const getAuditLogs = () => deprecated('getAuditLogs');
export const getMetrics = () => deprecated('getMetrics');
export const updateMetric = () => deprecated('updateMetric');
export const incrementMetric = () => deprecated('incrementMetric');
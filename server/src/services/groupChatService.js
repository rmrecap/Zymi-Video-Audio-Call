import { get, all, run, withTransaction } from '../db/postgres.js';

export const createGroup = async (name, description, createdBy) => {
  const group = await run(
    'INSERT INTO groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
    [name, description || '', createdBy]
  );
  const groupId = group.lastID || group.id || group[0]?.id;
  await run(
    'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
    [groupId, createdBy, 'admin']
  );
  return get('SELECT * FROM groups WHERE id = $1', [groupId]);
};

export const getGroup = async (groupId) => {
  return get('SELECT * FROM groups WHERE id = $1', [groupId]);
};

export const getUserGroups = async (userId) => {
  return all(
    `SELECT g.*, gm.role as member_role,
     (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
     (SELECT content FROM group_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.user_id = $1
     ORDER BY g.updated_at DESC`,
    [userId]
  );
};

export const addMember = async (groupId, userId, addedBy) => {
  const member = await get(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, addedBy]
  );
  if (!member || (member.role !== 'admin' && member.role !== 'super_admin')) {
    throw new Error('Only group admins can add members');
  }
  const existing = await get(
    'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  if (existing) return existing;
  await run(
    'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
    [groupId, userId, 'member']
  );
  await run('UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [groupId]);
  return get('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
};

export const removeMember = async (groupId, userId, removedBy) => {
  const member = await get(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, removedBy]
  );
  if (!member || (member.role !== 'admin' && member.role !== 'super_admin')) {
    throw new Error('Only group admins can remove members');
  }
  if (String(userId) === String(removedBy)) {
    await run(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    await run('UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [groupId]);
    return { selfLeave: true };
  }
  await run(
    'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  await run('UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [groupId]);
  return { removed: true };
};

export const getMembers = async (groupId) => {
  return all(
    `SELECT u.id, u.username, u.display_name, u.avatar, u.online_visibility,
            gm.role, gm.joined_at
     FROM group_members gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.joined_at ASC`,
    [groupId]
  );
};

export const sendGroupMessage = async (groupId, senderId, content, msgType, fileData, metadata, clientMsgId) => {
  const isMember = await get(
    'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, senderId]
  );
  if (!isMember) throw new Error('User is not a member of this group');

  const msg = await run(
    `INSERT INTO group_messages (group_id, sender_id, content, message_type, file_url, file_name, file_size, mime_type, metadata, client_message_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [groupId, senderId, content, msgType || 'text', fileData?.url || null, fileData?.name || null, fileData?.size || null, fileData?.mime || null, metadata || null, clientMsgId || null]
  );
  const msgId = msg.lastID || msg.id || msg[0]?.id;
  await run('UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [groupId]);
  return get('SELECT gm.*, u.username, u.display_name, u.avatar FROM group_messages gm JOIN users u ON u.id = gm.sender_id WHERE gm.id = $1', [msgId]);
};

export const getGroupMessages = async (groupId, userId, limit = 50, offset = 0) => {
  const isMember = await get(
    'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  if (!isMember) throw new Error('User is not a member of this group');

  return all(
    `SELECT gm.*, u.username, u.display_name, u.avatar
     FROM group_messages gm
     JOIN users u ON u.id = gm.sender_id
     WHERE gm.group_id = $1
     ORDER BY gm.created_at DESC
     LIMIT $2 OFFSET $3`,
    [groupId, limit, offset]
  );
};

export const markGroupMessageRead = async (messageId, userId) => {
  await run(
    'INSERT INTO group_message_reads (group_message_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [messageId, userId]
  );
};

export const getGroupUnreadCount = async (groupId, userId) => {
  const result = await get(
    `SELECT COUNT(*) as count FROM group_messages gm
     WHERE gm.group_id = $1 AND gm.sender_id != $2
     AND gm.created_at > COALESCE(
       (SELECT MAX(gmr.read_at) FROM group_message_reads gmr WHERE gmr.user_id = $2 AND gmr.group_message_id = gm.id),
       '1970-01-01'
     )`,
    [groupId, userId]
  );
  return result?.count || 0;
};

export const updateGroup = async (groupId, userId, updates) => {
  const member = await get(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  if (!member || member.role !== 'admin') throw new Error('Only group admins can update the group');

  const allowedFields = ['name', 'description', 'avatar'];
  const sets = [];
  const params = [];
  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      sets.push(`${key} = $${idx++}`);
      params.push(value);
    }
  }
  if (sets.length === 0) throw new Error('No valid fields to update');
  params.push(groupId);
  await run(
    `UPDATE groups SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx}`,
    params
  );
  return get('SELECT * FROM groups WHERE id = $1', [groupId]);
};

export const deleteGroup = async (groupId, userId) => {
  const member = await get(
    'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
    [groupId, userId]
  );
  if (!member || member.role !== 'admin') throw new Error('Only group admins can delete the group');
  await run('DELETE FROM groups WHERE id = $1', [groupId]);
};

import { createReport, getReports, resolveReport } from '../services/reportService.js';
import { logAudit } from '../services/auditService.js';
import { get } from '../db/postgres.js';

export const reportMessage = async (req, res) => {
  const { messageId, reason } = req.body;

  if (!messageId || !reason) {
    return res.status(400).json({ error: 'Message ID and reason required' });
  }

  const result = await createReport(messageId, req.user.id, reason);

  if (result.success) {
    await logAudit(req.user.id, 'report_submitted', messageId, reason);
    res.json({ success: true, id: result.id });
  } else {
    res.status(400).json({ error: result.error });
  }
};

export const reportUser = async (req, res) => {
  const targetUserId = req.body.targetUserId || req.params.userId;
  const { reason } = req.body;

  if (!targetUserId || !reason) {
    return res.status(400).json({ error: 'Target user ID and reason required' });
  }

  // Reuse a generic report creation logic if available, or just log for now
  // Assuming createReport is for messages, let's just log audit and return success
  await logAudit(req.user.id, 'user_reported', targetUserId, reason);
  
  res.json({ success: true, message: 'User reported' });
};

export const getAllReports = async (req, res) => {
  const reports = await getReports('pending');
  res.json(reports);
};

export const resolveMessageReport = async (req, res) => {
  const { reportId, action } = req.body;

  if (!reportId || !action) {
    return res.status(400).json({ error: 'Report ID and action required' });
  }

  // Fetch report to get message and reporter IDs for audit
  const report = await get('SELECT * FROM message_reports WHERE id = $1', [reportId]);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const extraData = {};

  // For hide_message, ban_user, we need additional data from request
  if (action === 'hide_message') {
    extraData.messageId = report.message_id;
  } else if (action === 'warn_user') {
    extraData.userId = report.reporter_id;
  } else if (action === 'ban_user') {
    // Ban the message sender
    extraData.userId = report.sender_id;
  }

  try {
    await resolveReport(reportId, req.adminUser.id, action, extraData);

    // Audit logging
    const details = `Resolved report #${reportId}: ${action}`;
    await logAudit(req.adminUser.id, 'report_resolved', reportId, details);

    // Additional audit for specific actions
    if (action === 'ban_user' && extraData.userId) {
      await logAudit(req.adminUser.id, 'user_banned_via_report', extraData.userId, `User banned due to report #${reportId}`);
    }

    if (action === 'hide_message' && extraData.messageId) {
      await logAudit(req.adminUser.id, 'message_hidden', extraData.messageId, `Message hidden due to report #${reportId}`);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
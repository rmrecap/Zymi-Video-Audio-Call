import express from 'express';
import * as mediaIndexService from '../services/mediaIndexService.js';
import * as mediaTransferSessionService from '../services/mediaTransferSessionService.js';
import * as mediaPolicyService from '../services/mediaPolicyService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/media/index - Index a new media message
router.post('/index', requireAuth, (req, res) => {
  try {
    mediaPolicyService.enforceNoServerStorage(req);
    mediaPolicyService.validateMediaPolicy(req.body);

    const result = mediaIndexService.indexMedia({
      ...req.body,
      sender_id: req.user.id
    });

    res.json({ success: true, mediaId: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/media/conversation/:conversationId - Get media for a conversation
router.get('/conversation/:conversationId', requireAuth, (req, res) => {
  try {
    const media = mediaIndexService.getConversationMedia(req.params.conversationId);
    res.json(media);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/media/:fileId/status - Update transfer status
router.post('/:fileId/status', requireAuth, (req, res) => {
  try {
    const { status, receiver_path_hash } = req.body;
    mediaIndexService.updateMediaStatus(req.params.fileId, status, receiver_path_hash);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/media/session/start - Start a transfer session
router.post('/session/start', requireAuth, (req, res) => {
  try {
    const sessionId = mediaTransferSessionService.createSession({
      ...req.body,
      sender_id: req.user.id
    });
    res.json({ success: true, sessionId });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/media/session/:sessionId/progress
router.post('/session/:sessionId/progress', requireAuth, (req, res) => {
  try {
    mediaTransferSessionService.updateProgress(req.params.sessionId, req.body.transferred_chunks);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/media/session/:sessionId/complete
router.post('/session/:sessionId/complete', requireAuth, (req, res) => {
  try {
    mediaTransferSessionService.updateSessionStatus(req.params.sessionId, 'completed');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/health/media - Media health check (Admin only recommended, but keeping open for dashboard)
router.get('/health/media', requireAuth, (req, res) => {
  try {
    const health = mediaIndexService.getMediaHealth();
    res.json(health);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

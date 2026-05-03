import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import * as ProjectBrainService from '../services/projectBrainService.js';
import * as SystemHealthService from '../services/systemHealthService.js';
import * as RiskDetectionService from '../services/riskDetectionService.js';

const router = Router();

router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const summary = await ProjectBrainService.getProjectSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/phases', requireAdmin, (req, res) => {
  res.json(ProjectBrainService.getPhases());
});

router.get('/tasks', requireAdmin, (req, res) => {
  const { phaseId } = req.query;
  res.json(ProjectBrainService.getTasks(phaseId));
});

router.get('/health', requireAdmin, async (req, res) => {
  const health = await SystemHealthService.getAggregatedHealth();
  res.json(health);
});

router.get('/risks', requireAdmin, async (req, res) => {
  const risks = await RiskDetectionService.detectRisks();
  const persistentRisks = RiskDetectionService.getRiskEvents();
  res.json([...risks, ...persistentRisks]);
});

router.get('/deployment-checks', requireAdmin, (req, res) => {
  res.json(ProjectBrainService.getDeploymentChecks());
});

router.post('/risks/:id/acknowledge', requireAdmin, (req, res) => {
  RiskDetectionService.acknowledgeRisk(req.params.id);
  res.json({ success: true });
});

router.post('/tasks', requireAdmin, (req, res) => {
  ProjectBrainService.addTask(req.body);
  res.json({ success: true });
});

router.patch('/tasks/:id', requireAdmin, (req, res) => {
  ProjectBrainService.updateTask(req.params.id, req.body);
  res.json({ success: true });
});

export default router;

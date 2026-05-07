import { all, get, run } from '../db/postgres.js';
import { getAggregatedHealth } from './systemHealthService.js';
import { detectRisks } from './riskDetectionService.js';

export const getProjectSummary = async () => {
  const phases = await all('SELECT * FROM project_phases ORDER BY phase_number ASC');
  const health = await getAggregatedHealth();
  const risks = await detectRisks();
  const openRisks = await all('SELECT * FROM risk_events WHERE status = \'open\'');

  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const totalPhases = phases.length;
  const productionReadiness = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

  return {
    productionReadiness,
    completedPhases,
    totalPhases,
    health,
    risks: [...risks, ...openRisks],
    currentPhase: phases.find(p => p.status === 'in_progress') || phases[phases.length - 1]
  };
};

export const getPhases = async () => {
  return await all('SELECT * FROM project_phases ORDER BY phase_number ASC');
};

export const getTasks = async (phaseId) => {
  if (phaseId) {
    return await all('SELECT * FROM project_tasks WHERE phase_id = $1 ORDER BY priority DESC, created_at DESC', [phaseId]);
  }
  return await all('SELECT * FROM project_tasks ORDER BY priority DESC, created_at DESC');
};

export const addTask = async (task) => {
  const { phase_id, task_title, task_type, priority, risk_level, notes } = task;
  return await run(`
    INSERT INTO project_tasks (phase_id, task_title, task_type, priority, risk_level, notes)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [phase_id, task_title, task_type || 'feature', priority || 'medium', risk_level || 'LOW', notes]);
};

export const updateTask = async (id, updates) => {
  const keys = Object.keys(updates);
  if (keys.length === 0) return;

  let idx = 1;
  const fields = keys.map(k => `${k} = $${idx++}`).join(', ');
  const values = Object.values(updates);
  values.push(id);
  
  return await run(`UPDATE project_tasks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx}`, values);
};

export const getDeploymentChecks = async () => {
  return await all('SELECT * FROM deployment_checks ORDER BY created_at ASC');
};

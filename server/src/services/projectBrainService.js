import { all, get, run } from '../db/database.js';
import { getAggregatedHealth } from './systemHealthService.js';
import { detectRisks } from './riskDetectionService.js';

export const getProjectSummary = async () => {
  const phases = all('SELECT * FROM project_phases ORDER BY phase_number ASC');
  const health = await getAggregatedHealth();
  const risks = await detectRisks();
  const openRisks = all('SELECT * FROM risk_events WHERE status = "open"');

  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const totalPhases = phases.length;
  const productionReadiness = Math.round((completedPhases / totalPhases) * 100);

  return {
    productionReadiness,
    completedPhases,
    totalPhases,
    health,
    risks: [...risks, ...openRisks],
    currentPhase: phases.find(p => p.status === 'in_progress') || phases[phases.length - 1]
  };
};

export const getPhases = () => {
  return all('SELECT * FROM project_phases ORDER BY phase_number ASC');
};

export const getTasks = (phaseId) => {
  if (phaseId) {
    return all('SELECT * FROM project_tasks WHERE phase_id = ? ORDER BY priority DESC, created_at DESC', phaseId);
  }
  return all('SELECT * FROM project_tasks ORDER BY priority DESC, created_at DESC');
};

export const addTask = (task) => {
  const { phase_id, task_title, task_type, priority, risk_level, notes } = task;
  return run(`
    INSERT INTO project_tasks (phase_id, task_title, task_type, priority, risk_level, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `, phase_id, task_title, task_type || 'feature', priority || 'medium', risk_level || 'LOW', notes);
};

export const updateTask = (id, updates) => {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(id);
  return run(`UPDATE project_tasks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, ...values);
};

export const getDeploymentChecks = () => {
  return all('SELECT * FROM deployment_checks ORDER BY created_at ASC');
};

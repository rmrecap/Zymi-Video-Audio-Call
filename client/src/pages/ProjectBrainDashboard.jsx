import React, { useState, useEffect } from 'react';
import { API_URL } from '../config/api';
import SystemStatusMonitor from '../components/projectBrain/SystemStatusMonitor';
import PhaseProgressBoard from '../components/projectBrain/PhaseProgressBoard';
import RiskDetectionPanel from '../components/projectBrain/RiskDetectionPanel';
import RoadmapTimeline from '../components/projectBrain/RoadmapTimeline';
import DeploymentChecklist from '../components/projectBrain/DeploymentChecklist';
import ProjectHealthGrid from '../components/projectBrain/ProjectHealthGrid';
import AdminInsightCards from '../components/projectBrain/AdminInsightCards';
import MessageHealthCards from '../components/projectBrain/MessageHealthCards';
import TurnHealthCard from '../components/connectivity/TurnHealthCard';

const ProjectBrainDashboard = ({ admin }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/project-brain/summary`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch project brain summary');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-400">Loading Project Brain...</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6 bg-[#0f172a] min-h-screen text-slate-200">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="p-2 bg-blue-600/20 rounded-lg text-blue-400">🧠</span>
            Project Brain
          </h1>
          <p className="text-slate-400 text-sm">Autonomous Governance & Production Readiness Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Production Readiness</div>
            <div className="text-xl font-mono text-blue-400">{summary?.productionReadiness}%</div>
          </div>
          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000" 
              style={{ width: `${summary?.productionReadiness}%` }}
            />
          </div>
        </div>
      </div>

      <MessageHealthCards />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ProjectHealthGrid health={summary?.health} />
        </div>
        <TurnHealthCard />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SystemStatusMonitor health={summary?.health} />
          <PhaseProgressBoard phases={summary?.phases} />
          <RoadmapTimeline />
        </div>
        <div className="space-y-6">
          <AdminInsightCards summary={summary} />
          <RiskDetectionPanel risks={summary?.risks} onRefresh={fetchSummary} />
          <DeploymentChecklist />
        </div>
      </div>
    </div>
  );
};

export default ProjectBrainDashboard;

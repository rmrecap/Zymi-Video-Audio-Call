import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const PhaseProgressBoard = () => {
  const [phases, setPhases] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/project-brain/phases`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    })
    .then(res => res.json())
    .then(data => setPhases(data));
  }, []);

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-800/30">
        <h3 className="font-bold text-white">Phase Progress Board</h3>
      </div>
      <div className="p-6 space-y-6">
        {phases.map((phase) => (
          <div key={phase.id} className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  phase.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                  phase.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500 animate-pulse' : 
                  'bg-slate-700 text-slate-400'
                }`}>
                  Phase {phase.phase_number}
                </span>
                <span className="font-semibold text-slate-200">{phase.phase_name}</span>
              </div>
              <span className="font-mono text-slate-400">{phase.completion_percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  phase.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${phase.completion_percent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{phase.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhaseProgressBoard;

import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const DeploymentChecklist = () => {
  const [checks, setChecks] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/project-brain/deployment-checks`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
    })
    .then(res => res.json())
    .then(data => setChecks(data));
  }, []);

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-800/30">
        <h3 className="font-bold text-white">Deployment Checklist</h3>
      </div>
      <div className="p-4 space-y-2">
        {checks.map((check) => (
          <div key={check.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                check.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
              }`}>
                {check.status === 'completed' && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${check.status === 'completed' ? 'text-slate-500' : 'text-slate-300'}`}>
                {check.check_name}
              </span>
            </div>
            <span className={`text-[10px] uppercase font-bold ${
              check.status === 'completed' ? 'text-emerald-500' : 'text-slate-600'
            }`}>
              {check.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeploymentChecklist;

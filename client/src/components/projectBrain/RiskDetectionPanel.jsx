import React from 'react';
import { API_URL } from '../../config/api';

const RiskDetectionPanel = ({ risks, onRefresh }) => {
  const acknowledgeRisk = async (id) => {
    try {
      await fetch(`${API_URL}/api/admin/project-brain/risks/${id}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      onRefresh();
    } catch (err) {}
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${risks?.length > 0 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`}></span>
          Risk Detection Panel
        </h3>
        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
          {risks?.length || 0} Issues
        </span>
      </div>
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {(!risks || risks.length === 0) ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-emerald-500/20 text-4xl">🛡️</div>
            <p className="text-sm text-slate-500">No active security risks detected.</p>
          </div>
        ) : (
          risks.map((risk, i) => (
            <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      risk.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {risk.severity}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{risk.risk_type}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">{risk.title}</h4>
                </div>
                {risk.id && (
                  <button 
                    onClick={() => acknowledgeRisk(risk.id)}
                    className="text-[10px] text-slate-500 hover:text-white uppercase font-bold transition-colors"
                  >
                    Ack
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{risk.description}</p>
              <div className="text-[10px] text-slate-600 uppercase tracking-tighter">
                Affected: {risk.affected_area}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RiskDetectionPanel;

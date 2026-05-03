import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const CostGuardPanel = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connectivity/admin/cost-guard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      setRules(data);
    } catch (err) {
      console.error('Failed to fetch rules', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRule = async (data) => {
    try {
      await fetch(`${API_URL}/api/connectivity/admin/cost-guard`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      fetchRules();
    } catch (err) {}
  };

  if (loading) return <div className="p-8 text-slate-500">Loading cost guard rules...</div>;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Relay Cost Guard</h2>
        <p className="text-slate-400 text-sm">Enforce daily bandwidth and duration limits</p>
      </div>

      <div className="space-y-4">
        {rules.map(rule => (
          <div key={rule.id} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2">
                 <span className="text-white font-bold">{rule.rule_name}</span>
                 <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] uppercase font-mono">
                    {rule.country_iso || 'Global'}
                 </span>
               </div>
               <div className="flex items-center gap-2">
                 <label className="text-[10px] text-slate-500 uppercase font-bold">Active</label>
                 <input 
                   type="checkbox" 
                   checked={!!rule.is_active}
                   onChange={e => updateRule({...rule, is_active: e.target.checked ? 1 : 0})}
                   className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                 />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold">Max Relay Mins / User</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="number"
                     value={rule.max_relay_minutes_per_user_daily}
                     onChange={e => updateRule({...rule, max_relay_minutes_per_user_daily: parseInt(e.target.value)})}
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs font-mono"
                   />
                   <span className="text-xs text-slate-600">min</span>
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] text-slate-500 uppercase font-bold">Max Media MB / User</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="number"
                     value={rule.max_media_mb_per_user_daily}
                     onChange={e => updateRule({...rule, max_media_mb_per_user_daily: parseInt(e.target.value)})}
                     className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs font-mono"
                   />
                   <span className="text-xs text-slate-600">MB</span>
                 </div>
               </div>
            </div>

            <div className="mt-4 flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Alert Threshold:</span>
                  <span className="text-xs text-blue-400 font-mono">{rule.alert_threshold_percent}%</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Force TURN Allowed:</span>
                  <span className={`text-xs font-bold ${rule.force_turn_allowed ? 'text-green-400' : 'text-red-400'}`}>
                    {rule.force_turn_allowed ? 'YES' : 'NO'}
                  </span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostGuardPanel;

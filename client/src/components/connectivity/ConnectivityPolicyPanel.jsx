import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const ConnectivityPolicyPanel = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connectivity/admin/policies`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to fetch policies', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePolicy = async (id, updates) => {
    try {
      const policy = policies.find(p => p.id === id);
      const res = await fetch(`${API_URL}/api/connectivity/admin/policies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...policy, ...updates })
      });
      if (res.ok) fetchPolicies();
    } catch (err) {}
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Connectivity Policies</h2>
        <p className="text-slate-400 text-sm">Control relay behavior per region</p>
      </div>

      <div className="space-y-6">
        {policies.map(policy => (
          <div key={policy.id} className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-white font-bold">{policy.policy_name}</span>
                <span className="ml-3 px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-[10px] uppercase tracking-wider">
                  {policy.country_iso || 'Global'}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                   <label className="text-xs text-slate-500">Force TURN</label>
                   <input 
                     type="checkbox"
                     checked={!!policy.force_turn}
                     onChange={e => updatePolicy(policy.id, { force_turn: e.target.checked ? 1 : 0 })}
                     className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                   />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
               <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Direct Timeout</div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      value={policy.max_direct_connect_seconds}
                      onChange={e => updatePolicy(policy.id, { max_direct_connect_seconds: parseInt(e.target.value) })}
                      className="w-12 bg-transparent text-blue-400 font-mono text-sm border-none p-0 focus:ring-0"
                    />
                    <span className="text-xs text-slate-600">sec</span>
                  </div>
               </div>
               <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Auto-Fix</div>
                  <div className="text-xs text-blue-400 font-bold">Enabled</div>
               </div>
               <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Scope</div>
                  <div className="text-[10px] text-slate-400">Calls + Media</div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectivityPolicyPanel;

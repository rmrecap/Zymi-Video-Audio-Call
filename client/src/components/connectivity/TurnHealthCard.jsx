import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const TurnHealthCard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connectivity/admin/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      
      const healthRes = await fetch(`${API_URL}/api/turn/health`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const healthData = await healthRes.json();
      
      const totalServers = healthData.length;
      const okServers = healthData.filter(s => s.status === 'ok').length;
      const healthPercent = totalServers > 0 ? Math.round((okServers / totalServers) * 100) : 0;

      setStats({
        ...data.summary,
        healthPercent
      });
    } catch (err) {
      console.error('Failed to fetch connectivity stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div className="animate-pulse bg-slate-900 h-32 rounded-xl"></div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Relay Connectivity</h3>
        <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
           <div className="text-2xl font-mono text-white">{stats.turnFallbacks}</div>
           <div className="text-[10px] text-slate-500 uppercase">Relay Fallbacks</div>
        </div>
        <div>
           <div className="text-2xl font-mono text-red-400">{stats.iceFailures}</div>
           <div className="text-[10px] text-slate-500 uppercase">Total ICE Failures</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
        <span className="text-[10px] text-slate-500 italic">Self-hosted mode active</span>
        <div className="flex items-center gap-2">
           <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
             <div 
               className={`h-full transition-all duration-500 ${stats.healthPercent < 50 ? 'bg-red-500' : 'bg-blue-500'}`} 
               style={{ width: `${stats.healthPercent}%` }}
             ></div>
           </div>
           <span className={`text-[10px] font-bold ${stats.healthPercent < 50 ? 'text-red-400' : 'text-blue-400'}`}>
             {stats.healthPercent}% Health
           </span>
        </div>
      </div>
    </div>
  );
};

export default TurnHealthCard;

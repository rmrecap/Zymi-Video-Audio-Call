import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const RelayUsageTable = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connectivity/admin/relay-usage`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const usage = await res.json();
      setData(usage);
    } catch (err) {
      console.error('Failed to fetch usage', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSeconds = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`;
  };

  if (loading) return <div className="p-8 text-slate-500">Loading usage statistics...</div>;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Relay Traffic Analysis</h2>
          <p className="text-slate-400 text-sm">Bandwidth and duration tracking for TURN sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatBox label="Total Data" value={formatBytes(data?.summary?.total?.total_bytes)} icon="🛰️" color="blue" />
        <StatBox label="Total Duration" value={formatSeconds(data?.summary?.total?.total_seconds)} icon="⏱️" color="green" />
        <StatBox label="Total Sessions" value={data?.summary?.total?.total_sessions || 0} icon="🔗" color="purple" />
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Usage by Country</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 font-bold uppercase tracking-widest">
                <tr>
                  <th className="p-3 rounded-l-lg">Region</th>
                  <th className="p-3">Events</th>
                  <th className="p-3">Bandwidth</th>
                  <th className="p-3 rounded-r-lg">Duration</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {data?.summary?.byCountry.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="p-3 font-bold">{item.country_iso || 'Global'}</td>
                    <td className="p-3">{item.events}</td>
                    <td className="p-3 font-mono">{formatBytes(item.bytes)}</td>
                    <td className="p-3 font-mono">{formatSeconds(item.seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data?.anomalies?.length > 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
             <h3 className="text-red-400 font-bold text-sm mb-3">⚠️ Detected Anomalies</h3>
             <div className="space-y-2">
               {data.anomalies.map((a, idx) => (
                 <div key={idx} className="text-[10px] text-red-300 flex justify-between">
                   <span>User ID: {a.user_id} ({a.country_iso})</span>
                   <span className="font-mono">{Math.round(a.minutes)}m | {Math.round(a.mb)}MB</span>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon, color }) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>
    </div>
    <div className={`text-xl font-mono font-bold text-${color}-400`}>{value}</div>
  </div>
);

export default RelayUsageTable;

import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const TurnLiveHealthPanel = () => {
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(null);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/api/turn/health`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to fetch TURN health', err);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (serverId) => {
    setTesting(serverId);
    try {
      await fetch(`${API_URL}/api/turn/admin/servers/${serverId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchHealth();
    } catch (err) {
      alert('Test failed');
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Live Relay Health</h2>
          <p className="text-slate-400 text-sm">Real-time reachability monitoring (UDP/TCP/TLS)</p>
        </div>
        <button 
          onClick={fetchHealth}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
          title="Refresh"
        >
          🔄
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-8 text-center animate-pulse">Checking servers...</div>
      ) : (
        <div className="space-y-4">
          {healthData.map(server => (
            <div key={server.server_id} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{server.label}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      server.status === 'ok' ? 'bg-green-500/20 text-green-400' : 
                      server.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {server.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    ID: {server.server_id} • Last Check: {server.checked_at ? new Date(server.checked_at).toLocaleTimeString() : 'Never'}
                  </div>
                </div>
                <button 
                  onClick={() => runTest(server.server_id)}
                  disabled={testing === server.server_id}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    testing === server.server_id ? 'bg-slate-700 text-slate-500' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                  }`}
                >
                  {testing === server.server_id ? 'Testing...' : 'Run Test'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <HealthIndicator label="UDP" active={server.udp_reachable} />
                 <HealthIndicator label="TCP" active={server.tcp_reachable} />
                 <HealthIndicator label="TLS" active={server.tls_reachable} />
              </div>

              {server.latency_ms > 0 && (
                <div className="mt-3 flex items-center gap-2">
                   <div className="text-[10px] text-slate-500 uppercase font-bold">Latency:</div>
                   <div className="text-xs font-mono text-blue-400">{server.latency_ms}ms</div>
                </div>
              )}

              {server.error_message && (
                <div className="mt-2 text-[10px] text-red-400 bg-red-400/5 p-2 rounded border border-red-400/20">
                  Error: {server.error_message}
                </div>
              )}
            </div>
          ))}
          {healthData.length === 0 && (
            <div className="text-slate-600 py-4 text-center">No active servers found for health check.</div>
          )}
        </div>
      )}
    </div>
  );
};

const HealthIndicator = ({ label, active }) => (
  <div className={`p-2 rounded-lg border flex flex-col items-center ${
    active ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-900 border-slate-800'
  }`}>
    <span className={`text-[10px] font-bold uppercase ${active ? 'text-green-400' : 'text-slate-600'}`}>{label}</span>
    <span className="text-lg mt-1">{active ? '✅' : '❌'}</span>
  </div>
);

export default TurnLiveHealthPanel;

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function PresencePage() {
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionTarget, setActionTarget] = useState('');
  const [actionType, setActionType] = useState('disconnect');
  const [actionMsg, setActionMsg] = useState('');
  const [actionStatus, setActionStatus] = useState('');

  const fetchMap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/socket-registry/map');
      setMap(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMap();
    const iv = setInterval(fetchMap, 15000);
    return () => clearInterval(iv);
  }, [fetchMap]);

  const executeAction = async () => {
    if (!actionTarget) return;
    setActionStatus('executing');
    try {
      const endpoint = actionType === 'disconnect' ? '/api/admin/socket-registry/disconnect'
        : actionType === 'invalidate' ? '/api/admin/socket-registry/invalidate-token'
        : actionType === 'ban' ? '/api/admin/global-ban' : null;
      if (!endpoint) { setActionStatus('invalid'); return; }

      const body = { userId: parseInt(actionTarget) };
      if (actionType === 'ban') body.reason = actionMsg || 'Moderator action';

      await api.post(endpoint, body);
      setActionStatus('success');
      setActionMsg('');
      fetchMap();
    } catch (e) {
      setActionStatus('error');
      console.error(e);
    }
    setTimeout(() => setActionStatus(''), 5000);
  };

  if (loading && !map) return <div className="flex items-center justify-center h-64"><div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING SOCKET MAP...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-mono text-white">◈ Live Socket Presence & Moderation</h2>
        <button onClick={fetchMap} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳ REFRESH</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatusCard label="Connected Sockets" value={map?.connectedSockets ?? '—'} color="text-cyber-accent" />
        <StatusCard label="Local Map Size" value={map?.localMapSize ?? '—'} color="text-cyber-green" />
        <StatusCard label="Redis Entries" value={map?.redisEntries?.length ?? '—'} color={map?.redisAvailable ? 'text-cyber-green' : 'text-cyber-amber'} />
        <StatusCard label="Active Rooms" value={map?.rooms?.length ?? '—'} color="text-cyber-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-cyber-card border border-cyber-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono text-cyber-accent">Socket Connections</h3>
            <span className="text-[10px] font-mono text-white/30">Auto-refresh every 15s</span>
          </div>
          {(!map?.redisEntries || map.redisEntries.length === 0) && (
            <p className="text-xs font-mono text-white/40 py-4 text-center">No active socket entries in Redis. When users connect, their socket registrations appear here.</p>
          )}
          {map?.redisEntries?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-white/40 border-b border-cyber-border">
                    <th className="text-left py-2 pr-4">User ID</th>
                    <th className="text-left py-2 pr-4">Type</th>
                    <th className="text-left py-2 pr-4">Socket ID</th>
                    <th className="text-left py-2">Connected At</th>
                  </tr>
                </thead>
                <tbody>
                  {map.redisEntries.map((e, i) => (
                    <tr key={i} className="border-b border-cyber-border/50 hover:bg-white/5">
                      <td className="py-2 pr-4 text-cyber-accent">{e.userId}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${e.type === 'UI' ? 'bg-cyber-accent/20 text-cyber-accent' : 'bg-cyber-purple/20 text-cyber-purple'}`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-white/60 font-[9px]">{e.socketId}</td>
                      <td className="py-2 text-white/40">{new Date(e.connectedAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-mono text-cyber-accent">Moderation Command Center</h3>

          <div>
            <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">User ID</label>
            <input placeholder="Enter user ID..." value={actionTarget}
              onChange={e => setActionTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono mt-1" />
          </div>

          <div>
            <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Action</label>
            <select value={actionType} onChange={e => setActionType(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-mono">
              <option value="disconnect">Force Disconnect</option>
              <option value="invalidate">Invalidate Token</option>
              <option value="ban">Global Ban</option>
            </select>
          </div>

          {actionType === 'ban' && (
            <div>
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Reason</label>
              <input placeholder="Ban reason..." value={actionMsg}
                onChange={e => setActionMsg(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xs font-mono mt-1" />
            </div>
          )}

          <button onClick={executeAction} disabled={!actionTarget || actionStatus === 'executing'}
            className="w-full py-2 text-xs font-mono text-cyber-red border border-cyber-red/30 rounded-lg hover:bg-cyber-red/10 transition-all">
            {actionStatus === 'executing' ? '⟳ EXECUTING...' : '⚡ EXECUTE'}
          </button>

          {actionStatus === 'success' && <p className="text-xs font-mono text-cyber-green">✓ Action executed successfully</p>}
          {actionStatus === 'error' && <p className="text-xs font-mono text-cyber-red">✗ Action failed — check user ID</p>}
          {actionStatus === 'invalid' && <p className="text-xs font-mono text-cyber-amber">⚠ Invalid action type</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
          <h3 className="text-sm font-mono text-cyber-accent mb-3">Active Rooms ({map?.rooms?.length || 0})</h3>
          {(!map?.rooms || map.rooms.length === 0) && (
            <p className="text-xs font-mono text-white/40">No active rooms. Rooms appear when users are in calls or group chats.</p>
          )}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {map?.rooms?.map((r, i) => (
              <div key={i} className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-white/5">
                <span className="text-xs font-mono text-white/70 truncate max-w-[200px]">{r.room}</span>
                <span className="text-[10px] font-mono text-cyber-accent">{r.sockets} socket{r.sockets !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6">
          <h3 className="text-sm font-mono text-cyber-accent mb-3">Redis Status</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-white/50">Available</span>
              <span className={map?.redisAvailable ? 'text-cyber-green' : 'text-cyber-amber'}>{map?.redisAvailable ? 'ACTIVE' : 'OFFLINE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Routing Mode</span>
              <span className="text-cyber-amber">{map?.redisAvailable ? 'redis-adapter' : 'local-map-primary'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Registry Entries</span>
              <span className="text-cyber-accent">{map?.redisEntries?.length || 0}</span>
            </div>
            <div className="mt-4 p-3 bg-cyber-amber/10 border border-cyber-amber/30 rounded-lg">
              <p className="text-[10px] text-cyber-amber font-mono">
                {map?.redisAvailable
                  ? 'Redis is connected. Socket registry distributed across nodes.'
                  : 'Redis unavailable. Fallback to local Map. Multi-node routing will not work.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value, color }) {
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 glow-card">
      <p className="text-xs font-mono text-white/40 tracking-wider uppercase">{label}</p>
      <p className={`text-3xl font-bold mt-2 font-mono ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [messageHealth, setMessageHealth] = useState(null);
  const [callHealth, setCallHealth] = useState(null);
  const [socketHealth, setSocketHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, mh, ch, sh] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/message-health'),
        api.get('/api/admin/call-health'),
        api.get('/api/admin/socket-registry-health'),
      ]);
      setStats(s.data);
      setMessageHealth(mh.data);
      setCallHealth(ch.data);
      setSocketHealth(sh.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING TELEMETRY...</div></div>;

  const formatUptime = (s) => s ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s` : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-mono text-white">◈ Infrastructure Telemetry</h2>
        <button onClick={fetchAll} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳ REFRESH</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Users" value={stats?.totalUsers} icon="◉" color="text-cyber-accent" />
        <StatCard label="Messages Sent" value={stats?.totalMessages} icon="◈" color="text-cyber-green" />
        <StatCard label="Active Connections" value={stats?.activeConnections} icon="◉" color="text-cyber-amber" />
        <StatCard label="Server Uptime" value={formatUptime(stats?.serverUptime)} icon="⏱" color="text-cyber-purple" />
        <StatCard label="Calls Today" value={stats?.callsToday} icon="◈" color="text-cyber-green" />
        <StatCard label="Messages Today" value={stats?.messagesToday} icon="◈" color="text-cyber-accent" />
        <StatCard label="Active Calls" value={callHealth?.activeCalls ?? stats?.activeCalls} icon="◉" color="text-cyber-amber" />
        <StatCard label="Avg Call Duration" value={callHealth?.averageCallDuration ? `${Math.round(callHealth.averageCallDuration / 60)}m` : '—'} icon="⏱" color="text-cyber-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-white/40 tracking-wider mb-3">MESSAGE HEALTH</h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between"><span className="text-white/50">Total</span><span className="text-cyber-accent">{messageHealth?.totalMessages ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Today</span><span className="text-cyber-green">{messageHealth?.messagesToday ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">7 Days</span><span className="text-cyber-amber">{messageHealth?.messagesLast7Days ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Reported</span><span className="text-cyber-red">{messageHealth?.reportedMessages ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Health</span><span className={messageHealth?.healthScore > 80 ? 'text-cyber-green' : 'text-cyber-amber'}>{messageHealth?.healthScore ?? '—'}%</span></div>
          </div>
        </div>
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-white/40 tracking-wider mb-3">CALL HEALTH</h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between"><span className="text-white/50">Total Calls</span><span className="text-cyber-accent">{callHealth?.totalCalls ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Today</span><span className="text-cyber-green">{callHealth?.callsToday ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Failed Today</span><span className="text-cyber-red">{callHealth?.failedCallsToday ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Avg Duration</span><span className="text-cyber-amber">{callHealth?.averageCallDuration ? `${Math.round(callHealth.averageCallDuration / 60)}m` : '—'}</span></div>
          </div>
        </div>
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-white/40 tracking-wider mb-3">SOCKET REGISTRY</h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between"><span className="text-white/50">Local Map</span><span className="text-cyber-accent">{socketHealth?.localMapSize ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Redis</span><span className={socketHealth?.redisAvailable ? 'text-cyber-green' : 'text-cyber-amber'}>{socketHealth?.redisAvailable ? 'ACTIVE' : 'OFFLINE'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Routing</span><span className="text-cyber-amber font-[9px]">{socketHealth?.routingMode ?? '—'}</span></div>
          </div>
          {socketHealth?.warnings?.length > 0 && (
            <div className="mt-3 p-2 bg-cyber-red/10 border border-cyber-red/30 rounded-lg">
              <p className="text-cyber-red text-[10px] font-mono">{socketHealth.warnings.join('; ')}</p>
            </div>
          )}
        </div>
      </div>

      {(stats?.metrics) && (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-white/40 tracking-wider mb-3">SYSTEM METRICS</h3>
          <pre className="text-xs font-mono text-cyber-green/80 whitespace-pre-wrap">{JSON.stringify(stats.metrics, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

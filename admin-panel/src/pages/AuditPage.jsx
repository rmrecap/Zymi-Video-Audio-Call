import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [risks, setRisks] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [l, r] = await Promise.all([
        api.get('/api/admin/audit', { params: { limit: 100 } }),
        api.get('/api/admin/risks'),
      ]);
      setLogs(l.data || []);
      setRisks(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return <div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING AUDIT...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-mono text-white">⚠ Audit & Security Anomaly Center</h2>
        <button onClick={fetchAll} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳ REFRESH</button>
      </div>

      {risks && (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-cyber-amber tracking-wider mb-3">⚠ RISK & SECURITY ANOMALY REPORT</h3>
          <div className="space-y-3">
            {(risks.risks || []).map((r, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm font-mono ${
                r.level === 'critical' ? 'bg-cyber-red/10 border-cyber-red/30 text-cyber-red' :
                r.level === 'warning' ? 'bg-cyber-amber/10 border-cyber-amber/30 text-cyber-amber' :
                'bg-cyber-accent/10 border-cyber-accent/30 text-cyber-accent'
              }`}>
                <span className="uppercase text-[10px] opacity-60">[{r.level}]</span> {r.message}
              </div>
            ))}
            {(risks.recommendations || []).length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-white/40 font-mono mb-2">RECOMMENDATIONS:</p>
                {(risks.recommendations || []).map((rec, i) => (
                  <p key={i} className="text-xs font-mono text-cyber-green/80 ml-2">→ {rec.description}</p>
                ))}
              </div>
            )}
            {(!risks.risks || risks.risks.length === 0) && (
              <p className="text-cyber-green font-mono text-sm">✓ No active security risks detected</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-cyber-border">
          <h3 className="text-xs font-mono text-white/40 tracking-wider">AUDIT LOG TERMINAL</h3>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-cyber-card">
              <tr className="border-b border-cyber-border text-[10px] text-white/30 uppercase tracking-wider">
                <th className="text-left p-3">Timestamp</th>
                <th className="text-left p-3">Admin</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Target</th>
                <th className="text-left p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-cyber-border/30 hover:bg-white/5">
                  <td className="p-3 text-white/40">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</td>
                  <td className="p-3 text-cyber-amber">{log.admin_username || `#${log.admin_id}`}</td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded ${
                      log.action?.includes('ban') ? 'bg-cyber-red/10 text-cyber-red' :
                      log.action?.includes('role') ? 'bg-cyber-amber/10 text-cyber-amber' :
                      'bg-cyber-accent/10 text-cyber-accent'
                    }`}>{log.action}</span>
                  </td>
                  <td className="p-3 text-white/60">{log.target_username || `#${log.target_user_id}`}</td>
                  <td className="p-3 text-white/40 max-w-[200px] truncate">{log.details || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-white/30">No audit logs</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-[10px] text-white/20 font-mono border-t border-cyber-border">
          {logs.length} log entries · all actions are immutable
        </div>
      </div>
    </div>
  );
}

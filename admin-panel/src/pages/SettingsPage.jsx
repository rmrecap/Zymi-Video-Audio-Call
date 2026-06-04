import { useState, useEffect } from 'react';
import api from '../services/api';

export default function SettingsPage() {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const ms = await api.get('/api/admin/migrations');
      setMigrationStatus(ms.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleExport = async (format) => {
    setExporting(true);
    setExportMsg('');
    try {
      const res = await api.get('/api/admin/export', { params: { format }, responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `zymi_export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportMsg(`✓ ${format.toUpperCase()} export downloaded`);
    } catch (e) {
      setExportMsg(`⛔ Export failed: ${e.message}`);
    }
    setExporting(false);
  };

  if (loading) return <div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING SYSTEM SETTINGS...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-mono text-white">⛭ System Settings & Operations</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-white/40 tracking-wider mb-3">🗄 DATABASE MIGRATION STATUS</h3>
          <div className="space-y-2">
            {(migrationStatus || []).map((m, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-black/30 text-sm font-mono">
                <span className="text-white/60">{m.name}</span>
                <span className={m.exists ? 'text-cyber-green' : 'text-cyber-red'}>{m.exists ? '✓ EXISTS' : '✗ MISSING'}</span>
              </div>
            ))}
            {(!migrationStatus || migrationStatus.length === 0) && (
              <p className="text-white/30 text-sm font-mono">No migration data available</p>
            )}
          </div>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-white/40 tracking-wider mb-3">💾 DATA EXPORT & BACKUP</h3>
          <div className="space-y-3">
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="w-full py-3 text-sm font-mono text-cyber-accent border border-cyber-accent/30 rounded-xl hover:bg-cyber-accent/10 disabled:opacity-50"
            >
              {exporting ? '⟳ EXPORTING...' : '⟱ EXPORT AS JSON'}
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="w-full py-3 text-sm font-mono text-cyber-green border border-cyber-green/30 rounded-xl hover:bg-cyber-green/10 disabled:opacity-50"
            >
              {exporting ? '⟳ EXPORTING...' : '⟱ EXPORT AS CSV'}
            </button>
            {exportMsg && <p className={`text-xs font-mono text-center mt-2 ${exportMsg.startsWith('✓') ? 'text-cyber-green' : 'text-cyber-red'}`}>{exportMsg}</p>}
          </div>
        </div>
      </div>

      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
        <h3 className="text-xs font-mono text-white/40 tracking-wider mb-3">⛭ SECURITY ADVISORY</h3>
        <div className="p-4 bg-cyber-red/5 border border-cyber-red/20 rounded-lg">
          <p className="text-xs font-mono text-cyber-red/80 leading-relaxed">
            This portal is a restricted administrative interface. All access is logged and audited.
            Unauthorized access attempts are reported as [SECURITY_ANOMALY] events.
            The backend enforces strict role-based access control at every endpoint.
          </p>
        </div>
      </div>
    </div>
  );
}

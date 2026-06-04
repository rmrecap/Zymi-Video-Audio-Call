import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const NETWORK_KEYS = ['network_key', 'sdk_key', 'app_id', 'interstitial_id', 'native_id', 'rewarded_id', 'banner_id', 'is_active'];
const LABELS = { network_key: 'Network', is_active: 'Active' };

export default function MonetizationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [tab, setTab] = useState('global');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        api.get('/api/admin/ad-control/settings'),
        api.get('/api/admin/revenue/summary').catch(() => ({ data: null }))
      ]);
      setData(s.data);
      setRevenue(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateGlobal = async (vals) => {
    setSaving('global');
    try { await api.post('/api/admin/ad-control/global', vals); await fetchAll(); } catch (e) { console.error(e); }
    setSaving(null);
  };

  const updateNetwork = async (vals) => {
    setSaving(vals.network_key);
    try { await api.post('/api/admin/ad-control/network', vals); await fetchAll(); } catch (e) { console.error(e); }
    setSaving(null);
  };

  const updatePlacement = async (vals) => {
    setSaving(vals.placement_key);
    try { await api.post('/api/admin/ad-control/placement', vals); await fetchAll(); } catch (e) { console.error(e); }
    setSaving(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING AD ENGINE...</div></div>;

  const tabs = ['global', 'networks', 'placements', 'revenue', 'rules'];
  const g = data?.global;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-mono text-white">◈ Monetization & Ad Engine</h2>
        <button onClick={fetchAll} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳ REFRESH</button>
      </div>

      <div className="flex gap-1 border-b border-cyber-border">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${tab === t ? 'text-cyber-accent border-b-2 border-cyber-accent' : 'text-white/40 hover:text-white/70'}`}>
            {t === 'global' ? 'Global Settings' : t === 'networks' ? 'Ad Networks' : t === 'placements' ? 'Placements' : t === 'revenue' ? 'Revenue' : 'Geo/Version Rules'}
          </button>
        ))}
      </div>

      {tab === 'global' && g && (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-mono text-cyber-accent">Global Ad Settings</h3>
          <ToggleRow label="Ads Enabled" value={g.ads_enabled} onChange={v => updateGlobal({ ...g, ads_enabled: v })} saving={saving === 'global'} />
          <ToggleRow label="Test Mode" value={g.test_mode} onChange={v => updateGlobal({ ...g, test_mode: v })} saving={saving === 'global'} />
          <SelectRow label="Active Network" value={g.active_network} options={data?.networks?.map(n => n.network_key) || []} onChange={v => updateGlobal({ ...g, active_network: v })} saving={saving === 'global'} />
          <SelectRow label="Fallback Network" value={g.fallback_network} options={data?.networks?.map(n => n.network_key) || []} onChange={v => updateGlobal({ ...g, fallback_network: v })} saving={saving === 'global'} />
          <NumberRow label="Interstitial Gap (seconds)" value={g.interstitial_gap_seconds} onChange={v => updateGlobal({ ...g, interstitial_gap_seconds: parseInt(v) || 1800 })} saving={saving === 'global'} />
          <NumberRow label="Native Refresh (seconds)" value={g.native_refresh_seconds} onChange={v => updateGlobal({ ...g, native_refresh_seconds: parseInt(v) || 60 })} saving={saving === 'global'} />
        </div>
      )}

      {tab === 'networks' && (
        <div className="space-y-4">
          {data?.networks?.map(net => (
            <div key={net.network_key} className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-mono text-cyber-accent uppercase">{net.network_key}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {NETWORK_KEYS.filter(k => k !== 'network_key').map(k => {
                  if (k === 'is_active') return null;
                  return (
                    <div key={k}>
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{LABELS[k] || k}</label>
                      <input value={net[k] || ''} onChange={e => Object.assign(net, { [k]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-xs font-mono" />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-mono text-white/60">
                  <input type="checkbox" checked={!!net.is_active} onChange={e => updateNetwork({ ...net, is_active: e.target.checked })} className="accent-cyber-accent" />
                  Active
                </label>
                <button onClick={() => updateNetwork(net)} disabled={saving === net.network_key}
                  className="px-4 py-1.5 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">
                  {saving === net.network_key ? '⟳ SAVING...' : 'SAVE'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'placements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.placements?.map(p => (
            <div key={p.placement_key} className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-mono text-cyber-accent uppercase">{p.placement_key.replace(/_/g, ' ')}</h3>
              <ToggleRow label="Enabled" value={p.enabled} onChange={v => updatePlacement({ ...p, enabled: v })} saving={saving === p.placement_key} />
              <NumberRow label="Min Delay (seconds)" value={p.min_delay_seconds} onChange={v => updatePlacement({ ...p, min_delay_seconds: parseInt(v) || 0 })} saving={saving === p.placement_key} />
            </div>
          ))}
        </div>
      )}

      {tab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Impressions" value={revenue?.totalImpressions ?? '—'} color="text-cyber-accent" />
          <StatCard label="Total Clicks" value={revenue?.totalClicks ?? '—'} color="text-cyber-green" />
          <StatCard label="Est. eCPM" value={revenue ? `$${revenue.estimatedECPM.toFixed(4)}` : '—'} color="text-cyber-amber" />
          <StatCard label="Est. Revenue" value={revenue ? `$${revenue.totalRevenue.toFixed(4)}` : '—'} color="text-cyber-purple" />
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-4 col-span-full">
            <p className="text-xs font-mono text-white/40">Tracking covers last 100 telemetry batches. Install ad SDKs in mobile builds to collect live data.</p>
          </div>
        </div>
      )}

      {tab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
            <h3 className="text-sm font-mono text-cyber-accent mb-3">Country Rules</h3>
            {data?.countryRules?.length === 0 && <p className="text-xs font-mono text-white/40">No country rules defined.</p>}
            {data?.countryRules?.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-cyber-border/50 text-xs font-mono">
                <span className="text-white/80">{r.country_code}</span>
                <span className={r.ads_enabled ? 'text-cyber-green' : 'text-cyber-red'}>{r.ads_enabled ? 'ENABLED' : 'DISABLED'}</span>
                {r.network_override && <span className="text-cyber-amber">{r.network_override}</span>}
              </div>
            ))}
          </div>
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
            <h3 className="text-sm font-mono text-cyber-accent mb-3">Version Rules</h3>
            {data?.versionRules?.length === 0 && <p className="text-xs font-mono text-white/40">No version rules defined.</p>}
            {data?.versionRules?.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-cyber-border/50 text-xs font-mono">
                <span className="text-white/80">v{r.app_version}</span>
                <span className={r.ads_enabled ? 'text-cyber-green' : 'text-cyber-red'}>{r.ads_enabled ? 'ADS ON' : 'ADS OFF'}</span>
                {r.force_update && <span className="text-cyber-amber">FORCE UPDATE</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, value, onChange, saving }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-mono text-white/60">{label}</span>
      <div className="flex items-center gap-3">
        {saving && <span className="text-[10px] text-cyber-amber animate-pulse">⟳</span>}
        <button onClick={() => onChange(!value)}
          className={`w-10 h-5 rounded-full transition-all ${value ? 'bg-cyber-accent' : 'bg-white/20'}`}>
          <div className={`w-4 h-4 bg-white rounded-full transition-all ${value ? 'ml-5' : 'ml-0.5'}`} />
        </button>
      </div>
    </div>
  );
}

function SelectRow({ label, value, options, onChange, saving }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-mono text-white/60">{label}</span>
      <div className="flex items-center gap-3">
        {saving && <span className="text-[10px] text-cyber-amber animate-pulse">⟳</span>}
        <select value={value || ''} onChange={e => onChange(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs font-mono">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );
}

function NumberRow({ label, value, onChange, saving }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs font-mono text-white/60">{label}</span>
      <div className="flex items-center gap-3">
        {saving && <span className="text-[10px] text-cyber-amber animate-pulse">⟳</span>}
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          className="w-24 px-3 py-1.5 rounded-lg text-xs font-mono text-right" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 glow-card">
      <p className="text-xs font-mono text-white/40 tracking-wider uppercase">{label}</p>
      <p className={`text-3xl font-bold mt-2 font-mono ${color || 'text-white'}`}>{value}</p>
    </div>
  );
}

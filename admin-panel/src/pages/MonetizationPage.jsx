import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING AD ENGINE...</div></div>;

  const tabs = ['global', 'placements', 'behavioral', 'networks', 'revenue', 'rules'];
  const g = data?.global;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-mono text-white">◈ Monetization & Ad Engine</h2>
        <button onClick={fetchAll} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳ REFRESH</button>
      </div>

      <div className="flex gap-1 border-b border-cyber-border overflow-x-auto">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all ${tab === t ? 'text-cyber-accent border-b-2 border-cyber-accent' : 'text-white/40 hover:text-white/70'}`}>
            {t === 'global' ? 'Global' : t === 'placements' ? 'Placements' : t === 'behavioral' ? 'Behavioral Engine' : t === 'networks' ? 'Ad Networks' : t === 'revenue' ? 'Revenue' : 'Rules'}
          </button>
        ))}
      </div>

      {tab === 'global' && g && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">Master Controls</h3>
            <ToggleRow label="Ads Enabled" value={g.ads_enabled} onChange={v => updateGlobal({ ...g, ads_enabled: v })} saving={saving === 'global'} desc="Global kill switch — disables all ad serving system-wide" />
            <ToggleRow label="Test Mode" value={g.test_mode} onChange={v => updateGlobal({ ...g, test_mode: v })} saving={saving === 'global'} desc="Test ads with placeholder creatives" />
            <SelectRow label="Active Network" value={g.active_network} options={data?.networks?.map(n => n.network_key) || []} onChange={v => updateGlobal({ ...g, active_network: v })} saving={saving === 'global'} />
            <SelectRow label="Fallback Network" value={g.fallback_network} options={data?.networks?.map(n => n.network_key) || []} onChange={v => updateGlobal({ ...g, fallback_network: v })} saving={saving === 'global'} />
          </div>
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">Intervals & Economy</h3>
            <NumberRow label="Interstitial Gap (seconds)" value={g.interstitial_gap_seconds} onChange={v => updateGlobal({ ...g, interstitial_gap_seconds: parseInt(v) || 1800 })} saving={saving === 'global'} desc="Minimum time between interstitials" />
            <NumberRow label="Native Refresh (seconds)" value={g.native_refresh_seconds} onChange={v => updateGlobal({ ...g, native_refresh_seconds: parseInt(v) || 60 })} saving={saving === 'global'} desc="Refresh rate for native/banner placements" />
            <NumberRow label="Ad-Free Minutes Coin Cost" value={g.ad_free_minutes_coin_cost} onChange={v => updateGlobal({ ...g, ad_free_minutes_coin_cost: parseInt(v) || 50 })} saving={saving === 'global'} desc="Coin cost for 'Ad-Free for 30 min' purchase" />
          </div>
        </div>
      )}

      {tab === 'placements' && g && (
        <div className="space-y-6">
          {/* Chat List (Primary Revenue Engine) */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">📋 Chat List — Native Ads</h3>
            <p className="text-[10px] font-mono text-white/30">Primary revenue engine. Injects native ads into the chat conversation list.</p>
            <NumberRow label="Ad Interval (every N items)" value={g.chat_list_ad_interval} onChange={v => updateGlobal({ ...g, chat_list_ad_interval: parseInt(v) || 10 })} saving={saving === 'global'} desc="1 native ad every N chat items" />
            <NumberRow label="Ad-Free First N Items" value={g.chat_list_ad_free_first} onChange={v => updateGlobal({ ...g, chat_list_ad_free_first: parseInt(v) || 5 })} saving={saving === 'global'} desc="First N items always ad-free" />
            <NumberRow label="VIP Ad Interval" value={g.chat_list_vip_ad_interval} onChange={v => updateGlobal({ ...g, chat_list_vip_ad_interval: parseInt(v) || 15 })} saving={saving === 'global'} desc="For VIP users: 1 ad every N items" />
            <ToggleRow label="Scroll-Aware Rendering" value={g.scroll_aware_enabled} onChange={v => updateGlobal({ ...g, scroll_aware_enabled: v })} saving={saving === 'global'} desc="Skip ad frames during rapid scrolling to prevent layout lag" />
          </div>

          {/* Chat Open Screen */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">💬 Chat Open Screen — Native Strip</h3>
            <p className="text-[10px] font-mono text-white/30">Subtle text+icon native strip below conversation header.</p>
            <ToggleRow label="Enabled" value={g.chat_open_ad_enabled} onChange={v => updateGlobal({ ...g, chat_open_ad_enabled: v })} saving={saving === 'global'} desc="Show subtle native strip in chat screen header" />
          </div>

          {/* Call End View */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">📞 Call End — Interstitial</h3>
            <p className="text-[10px] font-mono text-white/30">Full-screen interstitial immediately after call terminates.</p>
            <NumberRow label="Cooldown (minutes)" value={g.call_end_interstitial_cooldown_minutes} onChange={v => updateGlobal({ ...g, call_end_interstitial_cooldown_minutes: parseInt(v) || 30 })} saving={saving === 'global'} desc="Minimum time between call-end interstitials" />
            <NumberRow label="Min Calls Before Show" value={g.call_end_interstitial_min_calls} onChange={v => updateGlobal({ ...g, call_end_interstitial_min_calls: parseInt(v) || 3 })} saving={saving === 'global'} desc="User must complete N calls before interstitial triggers" />
          </div>

          {/* Settings Page */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">⚙️ Settings Page — Banner</h3>
            <p className="text-[10px] font-mono text-white/30">Static banner pinned at bottom with 'Earn Coins' CTA.</p>
            <ToggleRow label="Enabled" value={g.settings_banner_enabled} onChange={v => updateGlobal({ ...g, settings_banner_enabled: v })} saving={saving === 'global'} desc="Show 'Earn Coins' banner at bottom of settings" />
          </div>

          {/* Coin Shop */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">🪙 Coin Shop — Rewarded Ad Block</h3>
            <p className="text-[10px] font-mono text-white/30">Rewarded video block at top of coin shop page.</p>
            <ToggleRow label="Enabled" value={g.coin_shop_rewarded_enabled} onChange={v => updateGlobal({ ...g, coin_shop_rewarded_enabled: v })} saving={saving === 'global'} desc="Show rewarded ad block in coin shop" />
          </div>

          {/* Silent Rewarded Subsystem */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">🤫 Silent Rewarded Subsystem</h3>
            <p className="text-[10px] font-mono text-white/30">Subtle bottom-popup prompt incentivizing voluntary ad engagement.</p>
            <ToggleRow label="Enabled" value={g.silent_rewarded_enabled} onChange={v => updateGlobal({ ...g, silent_rewarded_enabled: v })} saving={saving === 'global'} desc="Show soft prompt for rewarded ad engagement" />
          </div>
        </div>
      )}

      {tab === 'behavioral' && g && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exit Intent Protocol */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">🚪 Exit Intent Protocol</h3>
            <p className="text-[10px] font-mono text-white/30">30% chance to serve an ad when user attempts to leave.</p>
            <ToggleRow label="Enabled" value={g.exit_intent_enabled} onChange={v => updateGlobal({ ...g, exit_intent_enabled: v })} saving={saving === 'global'} desc="Enable exit-intent ad trigger" />
            <NumberRow label="Trigger Chance (%)" value={g.exit_intent_chance_percent} onChange={v => updateGlobal({ ...g, exit_intent_chance_percent: parseInt(v) || 30 })} saving={saving === 'global'} desc="Rolling check probability (0-100)" />
            <ToggleRow label="VIP Exempt" value={g.exit_intent_vip_exempt} onChange={v => updateGlobal({ ...g, exit_intent_vip_exempt: v })} saving={saving === 'global'} desc="Skip exit ad for VIP subscribers" />
            <ToggleRow label="Rage User Exempt" value={g.exit_intent_rage_exempt} onChange={v => updateGlobal({ ...g, exit_intent_rage_exempt: v })} saving={saving === 'global'} desc="Skip exit ad if rapid clicking / connection issues detected" />
          </div>

          {/* Night Mode */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">🌙 Smart Silence Night Mode</h3>
            <p className="text-[10px] font-mono text-white/30">Dampen ad serving during late-night hours to maximize retention.</p>
            <NumberRow label="Start Hour (0-23)" value={g.night_mode_start_hour} onChange={v => updateGlobal({ ...g, night_mode_start_hour: parseInt(v) || 23 })} saving={saving === 'global'} desc="Hour when night mode activates" />
            <NumberRow label="End Hour (0-23)" value={g.night_mode_end_hour} onChange={v => updateGlobal({ ...g, night_mode_end_hour: parseInt(v) || 7 })} saving={saving === 'global'} desc="Hour when night mode deactivates" />
            <NumberRow label="Dampen By (%)" value={g.night_mode_dampen_percent} onChange={v => updateGlobal({ ...g, night_mode_dampen_percent: parseInt(v) || 80 })} saving={saving === 'global'} desc="Percentage to reduce ad frequency during night" />
          </div>

          {/* Dynamic Ad Density */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">📊 Dynamic Ad Density Engine</h3>
            <p className="text-[10px] font-mono text-white/30">Auto-scales frequency: lower density for highly active users, higher for passive users.</p>
            <p className="text-xs font-mono text-white/50">Algorithmic — no manual config needed. Adjusts based on real-time telemetry tracking.</p>
          </div>

          {/* Mood Detection */}
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">🧠 Mood Detection Model</h3>
            <p className="text-[10px] font-mono text-white/30">Parses UI variables (typing speed, activity bursts) to evaluate user sentiment and adjust ad serving accordingly.</p>
            <p className="text-xs font-mono text-white/50">Auto-inferred from client-side telemetry. No manual configuration.</p>
          </div>
        </div>
      )}

      {tab === 'networks' && (
        <div className="space-y-4">
          {data?.networks?.map(net => (
            <NetworkCard key={net.network_key} net={net} onSave={async (vals) => {
              setSaving(vals.network_key);
              try { await api.post('/api/admin/ad-control/network', vals); await fetchAll(); } catch (e) { console.error(e); }
              setSaving(null);
            }} saving={saving === net.network_key} />
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

function NetworkCard({ net, onSave, saving }) {
  const [local, setLocal] = useState({ ...net });
  useEffect(() => setLocal({ ...net }), [net]);
  const fields = ['sdk_key', 'app_id', 'interstitial_id', 'native_id', 'rewarded_id', 'banner_id'];
  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-cyber-accent uppercase">{local.network_key}</h3>
        <label className="flex items-center gap-2 text-xs font-mono text-white/60">
          <input type="checkbox" checked={!!local.is_active} onChange={e => setLocal(p => ({ ...p, is_active: e.target.checked }))} className="accent-cyber-accent" />
          Active
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map(k => (
          <div key={k}>
            <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{k.replace(/_/g, ' ')}</label>
            <input value={local[k] || ''} onChange={e => setLocal(p => ({ ...p, [k]: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono" />
          </div>
        ))}
      </div>
      <button onClick={() => onSave(local)} disabled={saving}
        className="px-4 py-1.5 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">
        {saving ? '⟳ SAVING...' : 'SAVE'}
      </button>
    </div>
  );
}

function ToggleRow({ label, value, onChange, saving, desc }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-xs font-mono text-white/60">{label}</span>
        {desc && <p className="text-[10px] font-mono text-white/30 mt-0.5">{desc}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
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

function NumberRow({ label, value, onChange, saving, desc }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-xs font-mono text-white/60">{label}</span>
        {desc && <p className="text-[10px] font-mono text-white/30 mt-0.5">{desc}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
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

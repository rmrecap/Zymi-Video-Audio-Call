import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function NearbyPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locEnabled, setLocEnabled] = useState(true);
  const [locSaving, setLocSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [s, ss] = await Promise.all([
        api.get('/api/admin/features/nearby-settings'),
        api.get('/api/admin/system-settings').catch(() => ({ data: {} }))
      ]);
      setSettings(s.data);
      if (ss.data?.location_tracking_global_enabled !== undefined) {
        setLocEnabled(ss.data.location_tracking_global_enabled);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateNearby = async () => {
    setSaving(true);
    try {
      await api.post('/api/admin/features/nearby-settings', settings);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const toggleLocation = async (v) => {
    setLocSaving(true);
    try {
      await api.post('/api/admin/location/toggle', { enabled: v });
      setLocEnabled(v);
    } catch (e) { console.error(e); }
    setLocSaving(false);
  };

  const setField = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING NEARBY SETTINGS...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-mono text-white">◈ Nearby Discovery Control</h2>
        <button onClick={fetchSettings} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳ REFRESH</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-mono text-cyber-accent">Geographical Parameters</h3>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Default Radius (km)</label>
            <p className="text-[10px] text-white/30 font-mono mt-0.5">Maximum search radius for nearby user discovery</p>
            <div className="flex items-center gap-3 mt-2">
              <input type="range" min="1" max="100" value={settings?.default_radius_km || 5}
                onChange={e => setField('default_radius_km', parseInt(e.target.value))}
                className="flex-1 accent-cyber-accent" />
              <span className="text-sm font-mono text-cyber-accent min-w-[3rem] text-right">{settings?.default_radius_km || 5} km</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Location Fuzzing</label>
            <p className="text-[10px] text-white/30 font-mono mt-0.5">Randomize user coordinates to protect privacy while matching</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-mono text-white/60">Approximate Only</span>
              <button onClick={() => setField('approximate_only', !settings?.approximate_only)}
                className={`w-10 h-5 rounded-full transition-all ${settings?.approximate_only ? 'bg-cyber-accent' : 'bg-white/20'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-all ${settings?.approximate_only ? 'ml-5' : 'ml-0.5'}`} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Privacy Mode</label>
            <p className="text-[10px] text-white/30 font-mono mt-0.5">NORMAL = visible within radius, HIDDEN = invisible, GHOST = appear but untrackable</p>
            <select value={settings?.privacy_mode || 'NORMAL'}
              onChange={e => setField('privacy_mode', e.target.value)}
              className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-mono">
              <option value="NORMAL">NORMAL</option>
              <option value="HIDDEN">HIDDEN</option>
              <option value="GHOST">GHOST</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Report Threshold</label>
            <p className="text-[10px] text-white/30 font-mono mt-0.5">Auto-flag users after N reports</p>
            <input type="number" value={settings?.report_threshold || 3}
              onChange={e => setField('report_threshold', parseInt(e.target.value) || 3)}
              className="w-24 px-3 py-2 rounded-lg text-xs font-mono mt-2" />
          </div>

          <button onClick={updateNearby} disabled={saving}
            className="w-full py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10 transition-all">
            {saving ? '⟳ SAVING...' : 'SAVE NEARBY SETTINGS'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-mono text-cyber-accent">Global Location Tracking</h3>
            <p className="text-xs font-mono text-white/40">When disabled, all users' location updates are rejected system-wide. Existing positions remain cached but no new updates are accepted.</p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-white/60">Location Tracking</span>
              <div className="flex items-center gap-3">
                {locSaving && <span className="text-[10px] text-cyber-amber animate-pulse">⟳</span>}
                <button onClick={() => toggleLocation(!locEnabled)}
                  className={`w-12 h-6 rounded-full transition-all ${locEnabled ? 'bg-cyber-green' : 'bg-cyber-red'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-all ${locEnabled ? 'ml-6' : 'ml-0.5'}`} />
                </button>
              </div>
            </div>
            <p className={`text-xs font-mono ${locEnabled ? 'text-cyber-green' : 'text-cyber-red'}`}>
              {locEnabled ? '● TRACKING ACTIVE' : '● TRACKING DISABLED'}
            </p>
          </div>

          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-mono text-cyber-accent">PostGIS Status</h3>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Spatial Extension</span>
              <span className="text-cyber-green">ENABLED</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Location Table</span>
              <span className="text-cyber-accent">nearby_visibility</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Indexed Column</span>
              <span className="text-cyber-amber">users.location (GEOMETRY)</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Privacy Layer</span>
              <span className="text-cyber-purple">{settings?.approximate_only ? 'FUZZING ±~500m' : 'PRECISE (±~5m)'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

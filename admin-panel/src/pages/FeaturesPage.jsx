import { useState, useEffect } from 'react';
import api from '../services/api';

export default function FeaturesPage() {
  const [features, setFeatures] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [f, ai] = await Promise.all([
        api.get('/api/admin/features'),
        api.get('/api/admin/ai-analysis'),
      ]);
      setFeatures(f.data || []);
      setAiAnalysis(ai.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleFeature = async (key, current) => {
    await api.post('/api/admin/features/update', { featureKey: key, enabled: !current });
    fetchAll();
  };

  if (loading) return <div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING FEATURES...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-mono text-white">⚙ Feature Flags & AI Core</h2>
        <button onClick={fetchAll} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳ REFRESH</button>
      </div>

      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
        <h3 className="text-xs font-mono text-white/40 tracking-wider mb-4">FEATURE FLAGS TOGGLE PANEL</h3>
        <div className="space-y-3">
          {features.map((f) => (
            <div key={f.id || f.feature_key} className="flex items-center justify-between p-3 rounded-lg border border-cyber-border/50 hover:border-cyber-accent/30 transition-all">
              <div>
                <p className="text-sm font-mono text-white">{f.feature_key}</p>
                {f.description && <p className="text-[10px] text-white/30 font-mono mt-0.5">{f.description}</p>}
              </div>
              <button
                onClick={() => toggleFeature(f.feature_key, f.enabled)}
                className={`relative w-14 h-7 rounded-full transition-all border ${
                  f.enabled ? 'bg-cyber-green/20 border-cyber-green/50' : 'bg-white/10 border-white/20'
                }`}
              >
                <span className={`absolute top-0.5 w-6 h-6 rounded-full transition-all ${
                  f.enabled ? 'left-7 bg-cyber-green' : 'left-0.5 bg-white/40'
                }`} />
              </button>
            </div>
          ))}
          {features.length === 0 && <p className="text-white/30 text-sm font-mono">No feature flags loaded</p>}
        </div>
      </div>

      {aiAnalysis?.analysis && (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
          <h3 className="text-xs font-mono text-cyber-purple tracking-wider mb-3">🧠 AI ANALYSIS & PROJECT BRAIN</h3>
          <div className="p-4 bg-black/30 rounded-lg border border-cyber-purple/20">
            <pre className="text-xs font-mono text-cyber-purple/80 whitespace-pre-wrap leading-relaxed">{aiAnalysis.analysis}</pre>
          </div>
          <p className="text-[10px] text-white/20 mt-2 font-mono">AI-generated platform metrics · automated behavioral analysis</p>
        </div>
      )}

      <div className="bg-cyber-card border border-cyber-border rounded-xl p-5">
        <h3 className="text-xs font-mono text-white/40 tracking-wider mb-3">🔬 PROJECT BRAIN TELEMETRY</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-black/30 rounded-lg border border-cyber-border/50">
            <p className="text-[10px] text-white/30 font-mono">Features</p>
            <p className="text-lg font-mono text-cyber-accent">{features.length}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-lg border border-cyber-border/50">
            <p className="text-[10px] text-white/30 font-mono">Enabled</p>
            <p className="text-lg font-mono text-cyber-green">{features.filter(f => f.enabled).length}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-lg border border-cyber-border/50">
            <p className="text-[10px] text-white/30 font-mono">Disabled</p>
            <p className="text-lg font-mono text-cyber-red">{features.filter(f => !f.enabled).length}</p>
          </div>
          <div className="p-3 bg-black/30 rounded-lg border border-cyber-border/50">
            <p className="text-[10px] text-white/30 font-mono">AI Status</p>
            <p className="text-lg font-mono text-cyber-purple">{aiAnalysis?.analysis ? 'ACTIVE' : 'OFFLINE'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

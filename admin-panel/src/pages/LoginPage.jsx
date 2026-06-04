import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [backendUrl, setBackendUrl] = useState(() => sessionStorage.getItem('zymi_api_base') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!backendUrl) { setError('Server URL is required'); return; }
    setLoading(true);
    try {
      const sanitizedUrl = backendUrl.replace(/\/+$/, '');
      await login(username, password, sanitizedUrl);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyber-accent tracking-[0.3em] font-mono">ZYMI</h1>
          <p className="text-cyber-accent/50 text-sm mt-2 font-mono">administration · secure gateway</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-cyber-card border border-cyber-border rounded-2xl p-8 space-y-5">
          <div>
            <label className="text-xs font-mono text-cyber-accent/70 tracking-wider block mb-1.5">⟐ BACKEND SERVER URL</label>
            <input value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} placeholder="https://zymi-server.onrender.com" className="w-full px-4 py-3 rounded-xl text-sm font-mono" />
            <p className="text-[9px] text-white/20 mt-1 font-mono">The Render server URL, not the admin portal URL</p>
          </div>
          <div>
            <label className="text-xs font-mono text-white/40 tracking-wider block mb-1.5">ADMIN USERNAME / EMAIL</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin_super or admin@zymi.com" className="w-full px-4 py-3 rounded-xl text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs font-mono text-white/40 tracking-wider block mb-1.5">PASSWORD</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl text-sm font-mono" />
          </div>
          {error && <p className="text-cyber-red text-sm font-mono text-center">⛔ {error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-cyber-accent/10 border border-cyber-accent/40 text-cyber-accent rounded-xl font-mono font-bold tracking-wider hover:bg-cyber-accent/20 disabled:opacity-50">
            {loading ? 'AUTHENTICATING...' : '⏎ AUTHENTICATE'}
          </button>
          <p className="text-[10px] text-white/20 text-center font-mono">secure endpoint · all access is audited</p>
        </form>
      </div>
    </div>
  );
}

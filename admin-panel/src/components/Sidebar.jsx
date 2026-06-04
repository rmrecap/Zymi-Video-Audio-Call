import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/users', label: 'Users', icon: '◉' },
  { to: '/audit', label: 'Audit & Security', icon: '⚠' },
  { to: '/features', label: 'Features & AI', icon: '⚙' },
  { to: '/settings', label: 'System Settings', icon: '⛭' },
];

export default function Sidebar({ admin, onLogout }) {
  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-cyber-card border-r border-cyber-border flex flex-col z-50">
      <div className="p-5 border-b border-cyber-border">
        <h1 className="text-cyber-accent text-xl font-bold tracking-wider">ZYMI::ADMIN</h1>
        <p className="text-xs text-cyber-accent/60 mt-1 font-mono">v1.0.0 · secure channel</p>
      </div>
      <div className="px-4 py-3 border-b border-cyber-border/50 text-xs text-cyber-amber font-mono">
        <span className="text-white/40">session: </span>
        <span className="text-cyber-green">{admin?.username || 'unknown'}</span>
        <span className="text-white/40 ml-2">[</span>
        <span className="text-cyber-amber">{admin?.role || '?'}</span>
        <span className="text-white/40">]</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-mono transition-all ${
                isActive
                  ? 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`
            }
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-cyber-border">
        <button
          onClick={onLogout}
          className="w-full px-4 py-2 text-sm font-mono text-cyber-red border border-cyber-red/30 rounded-lg hover:bg-cyber-red/10 transition-all"
        >
          ⚡ TERMINATE SESSION
        </button>
      </div>
    </aside>
  );
}

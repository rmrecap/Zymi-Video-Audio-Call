import { useState, useEffect } from 'react';
import api from '../services/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeBanned, setIncludeBanned] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (includeBanned) params.includeBanned = 'true';
      const res = await api.get('/api/admin/users', { params });
      setUsers(res.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [includeBanned]);

  const handleBan = async (id) => {
    if (!confirm('Ban this user?')) return;
    await api.post('/api/admin/ban', { userId: id, reason: 'Banned via admin panel' });
    fetchUsers();
  };

  const handleUnban = async (id) => {
    await api.post('/api/admin/unban', { userId: id });
    fetchUsers();
  };

  const handleRole = async (id, newRole) => {
    await api.post('/api/admin/role', { userId: id, newRole });
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold font-mono text-white">◉ User Management</h2>
        <div className="flex gap-3 items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username..." className="px-4 py-2 rounded-lg text-sm font-mono w-48" onKeyDown={(e) => e.key === 'Enter' && fetchUsers()} />
          <label className="flex items-center gap-2 text-xs font-mono text-white/50">
            <input type="checkbox" checked={includeBanned} onChange={(e) => setIncludeBanned(e.target.checked)} className="w-4 h-4" />
            Show banned
          </label>
          <button onClick={fetchUsers} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳</button>
        </div>
      </div>

      {loading ? (
        <div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING USERS...</div>
      ) : (
        <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-cyber-border text-xs text-white/40 tracking-wider uppercase">
                  <th className="text-left p-4">ID</th>
                  <th className="text-left p-4">Username</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Messages</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-cyber-border/50 hover:bg-white/5">
                    <td className="p-4 text-white/60">{u.id}</td>
                    <td className="p-4 text-white font-semibold">{u.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        u.role === 'super_admin' ? 'bg-cyber-red/10 text-cyber-red' :
                        u.role === 'admin' ? 'bg-cyber-amber/10 text-cyber-amber' :
                        'bg-cyber-accent/10 text-cyber-accent'
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-4 text-white/60">{u.message_count ?? 0}</td>
                    <td className="p-4">
                      {u.is_banned
                        ? <span className="text-cyber-red">BANNED</span>
                        : <span className="text-cyber-green">ACTIVE</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {!u.is_banned
                          ? <button onClick={() => handleBan(u.id)} className="px-3 py-1 text-[10px] font-mono text-cyber-red border border-cyber-red/30 rounded hover:bg-cyber-red/10">BAN</button>
                          : <button onClick={() => handleUnban(u.id)} className="px-3 py-1 text-[10px] font-mono text-cyber-green border border-cyber-green/30 rounded hover:bg-cyber-green/10">UNBAN</button>}
                        {u.role !== 'super_admin' && (
                          <select value={u.role} onChange={(e) => handleRole(u.id, e.target.value)} className="px-2 py-1 text-[10px] font-mono rounded border border-cyber-border !bg-transparent">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-white/30 font-mono">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 text-xs text-white/30 font-mono border-t border-cyber-border">
            {users.length} user{users.length !== 1 ? 's' : ''} loaded
          </div>
        </div>
      )}
    </div>
  );
}

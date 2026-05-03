import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';

const TurnServerManager = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newServer, setNewServer] = useState({
    label: '',
    stun_url: 'stun:your-domain.com:3478',
    turn_url_udp: 'turn:your-domain.com:3478?transport=udp',
    turn_url_tcp: 'turn:your-domain.com:3478?transport=tcp',
    turn_url_tls: 'turns:your-domain.com:5349?transport=tcp',
    username: '',
    credential: '',
    priority: 1
  });

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/turn/admin/servers`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error('Failed to fetch TURN servers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/turn/admin/servers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newServer)
      });
      if (res.ok) {
        setShowAdd(false);
        fetchServers();
      }
    } catch (err) {
      alert('Failed to add server');
    }
  };

  const toggleStatus = async (id, isActive) => {
    try {
      await fetch(`${API_URL}/api/turn/admin/servers/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive ? 0 : 1 })
      });
      fetchServers();
    } catch (err) {}
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">TURN Relay Servers</h2>
          <p className="text-slate-400 text-sm">Manage self-hosted Coturn infrastructure</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors"
        >
          Add Server
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 py-8 text-center">Loading servers...</div>
      ) : (
        <div className="space-y-4">
          {servers.map(server => (
            <div key={server.id} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">{server.label}</span>
                  <span className={`w-2 h-2 rounded-full ${server.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1">{server.stun_url}</div>
                <div className="flex gap-4 mt-2">
                   <div className="text-[10px] text-slate-400">UDP: {server.turn_url_udp ? '✅' : '❌'}</div>
                   <div className="text-[10px] text-slate-400">TCP: {server.turn_url_tcp ? '✅' : '❌'}</div>
                   <div className="text-[10px] text-slate-400">TLS: {server.turn_url_tls ? '✅' : '❌'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleStatus(server.id, server.is_active)}
                  className={`text-xs font-bold ${server.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                >
                  {server.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
          {servers.length === 0 && (
            <div className="text-slate-600 py-4 text-center border border-dashed border-slate-800 rounded-lg">
              No relay servers configured. System will use direct P2P only.
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e293b] border border-slate-700 w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Add Coturn Server</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Label</label>
                  <input 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"
                    placeholder="Primary Relay"
                    value={newServer.label}
                    onChange={e => setNewServer({...newServer, label: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Priority</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"
                    value={newServer.priority}
                    onChange={e => setNewServer({...newServer, priority: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase font-bold">STUN URL</label>
                <input 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm"
                  value={newServer.stun_url}
                  onChange={e => setNewServer({...newServer, stun_url: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase font-bold">TURN UDP URL</label>
                <input 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm"
                  value={newServer.turn_url_udp}
                  onChange={e => setNewServer({...newServer, turn_url_udp: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Username</label>
                  <input 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"
                    value={newServer.username}
                    onChange={e => setNewServer({...newServer, username: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Password / Secret</label>
                  <input 
                    type="password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"
                    value={newServer.credential}
                    onChange={e => setNewServer({...newServer, credential: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  className="px-6 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                >
                  Save Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TurnServerManager;

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QAGate from './QAGate.jsx';
import ProjectBrainDashboard from './ProjectBrainDashboard.jsx';
import AdControlCenter from './AdControlCenter.jsx';
import MonetizationHealthCard from './MonetizationHealthCard.jsx';
import EmailSettingsManager from './EmailSettingsManager.jsx';
import VerificationLinkTester from './VerificationLinkTester.jsx';
import TurnServerManager from '../connectivity/TurnServerManager.jsx';
import ConnectivityPolicyPanel from '../connectivity/ConnectivityPolicyPanel.jsx';
import TurnLiveHealthPanel from '../connectivity/TurnLiveHealthPanel.jsx';
import RelayUsageTable from '../connectivity/RelayUsageTable.jsx';
import CostGuardPanel from '../connectivity/CostGuardPanel.jsx';
import { API_URL } from '../../config/api.js';
import './AdminPanel.css';

function AdminPanel({ admin, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const isLoggingOut = useRef(false);

  const getActiveTab = () => {
    if (path.includes('/users')) return 'users';
    if (path.includes('/audit')) return 'audit';
    if (path.includes('/risks')) return 'risks';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/structure-lock')) return 'structure-lock';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/qa')) return 'qa';
    if (path.includes('/project-brain')) return 'project-brain';
    if (path.includes('/ads')) return 'ads';
    if (path.includes('/communication')) return 'communication';
    if (path.includes('/connectivity')) return 'connectivity';
    return 'dashboard';
  };

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeConnections: 0,
    activeCalls: 0,
    messagesToday: 0,
    callsToday: 0,
    failedCallsToday: 0,
    serverUptime: 0,
    dbStatus: 'healthy'
  });
  const [risks, setRisks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState(getActiveTab());
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [migrations, setMigrations] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [reports, setReports] = useState([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('adminToken');
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const [pollInterval, setPollInterval] = useState(5000);
  const pollTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchStats = async () => {
    if (isLoggingOut.current) return;
    const authHeader = getAuthHeader();
    if (!authHeader) {
      if (!isLoggingOut.current) {
        isLoggingOut.current = true;
        onLogout();
      }
      return;
    }

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        ...authHeader,
        signal: abortControllerRef.current.signal
      });

      if (res.status === 401 || res.status === 403) {
        if (!isLoggingOut.current) {
          isLoggingOut.current = true;
          console.warn('[ADMIN] Session expired. Logging out.');
          onLogout();
        }
        return;
      }

      if (!res.ok) throw new Error('Stats fetch failed');

      const data = await res.json();
      setStats(data);
      setLastUpdate(new Date());
      setPollInterval(5000); // Reset backoff on success
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch stats:', err);
      // Exponential backoff
      setPollInterval(prev => Math.min(prev * 2, 30000));
    }
  };

  const fetchRisks = async () => {
    if (isLoggingOut.current) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/risks`, authHeader);
      if (res.status === 401 || res.status === 403) return; // Handled by stats
      if (!res.ok) return;
      const data = await res.json();
      setRisks(data.risks || []);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Failed to fetch risks:', err);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchStats();
      fetchRisks();
      
      const runPolling = () => {
        pollTimerRef.current = setTimeout(async () => {
          await fetchStats();
          await fetchRisks();
          runPolling();
        }, pollInterval);
      };

      runPolling();
      
      return () => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        if (abortControllerRef.current) abortControllerRef.current.abort();
      };
    }
  }, [admin, pollInterval]);

  const fetchUsers = async () => {
    if (isLoggingOut.current) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;
    try {
      const query = userSearch ? `?search=${encodeURIComponent(userSearch)}` : '';
      const res = await fetch(`${API_URL}/api/admin/users${query}`, authHeader);
      if (res.status === 401 || res.status === 403) {
        if (!isLoggingOut.current) {
          isLoggingOut.current = true;
          onLogout();
        }
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchAuditLogs = async () => {
    if (isLoggingOut.current) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/audit?limit=50`, authHeader);
      if (res.status === 401 || res.status === 403) {
        if (!isLoggingOut.current) {
          isLoggingOut.current = true;
          onLogout();
        }
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  const fetchPermissions = async () => {
    if (isLoggingOut.current) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/permissions`, authHeader);
      if (res.status === 401 || res.status === 403) {
        if (!isLoggingOut.current) {
          isLoggingOut.current = true;
          onLogout();
        }
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setPermissions(data);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const fetchMigrations = async () => {
    if (isLoggingOut.current) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/migrations`, authHeader);
      if (res.status === 401 || res.status === 403) {
        if (!isLoggingOut.current) {
          isLoggingOut.current = true;
          onLogout();
        }
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setMigrations(data);
    } catch (err) {
      console.error('Failed to fetch migrations:', err);
    }
  };

  const fetchReports = async () => {
    if (isLoggingOut.current) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/reports`, authHeader);
      if (res.status === 401 || res.status === 403) {
        if (!isLoggingOut.current) {
          isLoggingOut.current = true;
          onLogout();
        }
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  };

  const resolveReport = async (reportId, action) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader().headers },
        body: JSON.stringify({ reportId, action })
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (err) {
      console.error('Failed to resolve report:', err);
    }
  };

  const handleBanUser = async (userId) => {
    const reason = prompt('Enter ban reason:');
    if (reason === null) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader().headers },
        body: JSON.stringify({ userId, reason })
      });
      if (res.ok) {
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to ban user:', err);
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/unban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader().headers },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        fetchUsers();
        fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to unban user:', err);
    }
  };

  const handleRoleChange = async (userId) => {
    if (!selectedRole) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader().headers },
        body: JSON.stringify({ userId, newRole: selectedRole })
      });
      if (res.ok) {
        setShowRoleModal(null);
        setSelectedRole('');
        fetchUsers();
        fetchAuditLogs();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to change role');
      }
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader().headers },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        fetchAuditLogs();
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        const data = await res.json();
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordError('An error occurred');
    }
  };

  const openRoleModal = (user) => {
    if (admin?.role !== 'super_admin') {
      alert('Only super_admin can change roles');
      return;
    }
    setShowRoleModal(user);
    setSelectedRole(user.role);
  };


  useEffect(() => {
    const tab = getActiveTab();
    setActiveTab(tab);
    if (tab === 'users') fetchUsers();
    else if (tab === 'audit') fetchAuditLogs();
    else if (tab === 'settings') fetchPermissions();
    else if (tab === 'structure-lock') fetchMigrations();
    else if (tab === 'reports') fetchReports();
  }, [path]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [userSearch]);

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const formatTime = (timestamp) => new Date(timestamp).toLocaleString();

  const getActionIcon = (action) => {
    if (!action) return '⚙️';
    if (action.includes('login')) return '🔑';
    if (action.includes('ban')) return '🚫';
    if (action.includes('unban')) return '✅';
    if (action.includes('call')) return '📞';
    if (action.includes('role')) return '👤';
    return '⚙️';
  };

  const navigateTo = (tab) => {
    setActiveTab(tab);
    const routes = {
      dashboard: '/exclusivesecure',
      users: '/exclusivesecure/users',
      audit: '/exclusivesecure/audit',
      risks: '/exclusivesecure/risks',
      settings: '/exclusivesecure/settings',
      'structure-lock': '/exclusivesecure/structure-lock',
      reports: '/exclusivesecure/reports',
      qa: '/exclusivesecure/qa',
      'project-brain': '/exclusivesecure/project-brain',
      ads: '/exclusivesecure/ads',
      communication: '/exclusivesecure/communication',
      connectivity: '/exclusivesecure/connectivity'
    };
    navigate(routes[tab]);
  };

  const lockedEvents = [
    'join', 'private-message', 'call-user', 'incoming-call',
    'make-answer', 'call-answer', 'ice-candidate', 'end-call',
    'reject-call', 'typing', 'stop-typing'
  ];

  const lockedFiles = [
    'client/src/components/Dashboard.jsx',
    'client/src/socket/SocketContext.jsx',
    'server/index.js (socket handlers)'
  ];

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <div className="admin-logo-icon">Z</div>
          <span className="admin-logo-text">ZYMI Admin</span>
        </div>
        
        <div className="admin-user-info">
          <div className="admin-avatar">{admin?.username?.[0]?.toUpperCase() || 'A'}</div>
          <div className="admin-name">{admin?.username}</div>
        </div>
        
        <nav className="admin-nav">
          <div className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => navigateTo('dashboard')}>
            <span>📊</span>
            <span>Dashboard</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => navigateTo('users')}>
            <span>👥</span>
            <span>Users</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => navigateTo('audit')}>
            <span>📋</span>
            <span>Audit Logs</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'risks' ? 'active' : ''}`} onClick={() => navigateTo('risks')}>
            <span>🚨</span>
            <span>Risks</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => navigateTo('settings')}>
            <span>⚙️</span>
            <span>Settings</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'structure-lock' ? 'active' : ''}`} onClick={() => navigateTo('structure-lock')}>
            <span>🔒</span>
            <span>Structure Lock</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => navigateTo('reports')}>
            <span>🚩</span>
            <span>Reports</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'qa' ? 'active' : ''}`} onClick={() => navigateTo('qa')}>
            <span>✅</span>
            <span>QA Gate</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'project-brain' ? 'active' : ''}`} onClick={() => navigateTo('project-brain')}>
            <span>🧠</span>
            <span>Project Brain</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => navigateTo('ads')}>
            <span>💰</span>
            <span>Ad Control</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'communication' ? 'active' : ''}`} onClick={() => navigateTo('communication')}>
            <span>📧</span>
            <span>Communication</span>
          </div>
          <div className={`admin-nav-item ${activeTab === 'connectivity' ? 'active' : ''}`} onClick={() => navigateTo('connectivity')}>
            <span>🔌</span>
            <span>Connectivity</span>
          </div>
          <div className="admin-nav-item" onClick={onLogout}>
            <span>🚪</span>
            <span>Logout</span>
          </div>
        </nav>
      </div>

      <div className="admin-main">
        {activeTab === 'dashboard' && (
          <>
            <div className="admin-header">
              <h1>System Health Dashboard</h1>
              <p>Real-time monitoring • Last update: {lastUpdate.toLocaleTimeString()}</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">👥</div>
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Total Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon messages">💬</div>
                <div className="stat-value">{stats.messagesToday}</div>
                <div className="stat-label">Messages Today</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon sockets">🔌</div>
                <div className="stat-value">{stats.activeConnections}</div>
                <div className="stat-label">Active Sockets</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon calls">📞</div>
                <div className="stat-value">{stats.activeCalls}</div>
                <div className="stat-label">Active Calls</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon call-fail">⚠️</div>
                <div className="stat-value">{stats.failedCallsToday}</div>
                <div className="stat-label">Failed Calls</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon uptime">⏱️</div>
                <div className="stat-value" style={{ fontSize: '24px' }}>{formatUptime(stats.serverUptime)}</div>
                <div className="stat-label">Server Uptime</div>
              </div>
              <MonetizationHealthCard authHeader={getAuthHeader()} API_URL={API_URL} />
            </div>

            <div className="status-section">
              <h2><span>⚡</span>System Status</h2>
              <div className={`status-indicator ${stats.activeConnections > 0 ? '' : 'inactive'}`}>
                <div className="status-dot"></div>
                <div>
                  <div className="status-text">{stats.activeConnections > 0 ? 'Socket Server Active' : 'Socket Server Idle'}</div>
                  <div className="status-time">Database: {stats.dbStatus}</div>
                </div>
              </div>
            </div>

            {risks.length > 0 && (
              <div className="status-section">
                <h2><span>🚨</span>Risk Alerts</h2>
                {risks.map((risk, idx) => (
                  <div key={idx} className={`risk-item ${risk.level}`}>
                    <span className="risk-icon">{risk.level === 'warning' ? '⚠️' : 'ℹ️'}</span>
                    <span>{risk.message}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'ads' && <AdControlCenter admin={admin} />}

        {activeTab === 'connectivity' && (
          <div className="space-y-6 p-4">
            <div className="admin-header">
              <h1>Connectivity & Observability</h1>
              <p>Real-time WebRTC Infrastructure Monitoring</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TurnLiveHealthPanel />
              <TurnServerManager />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RelayUsageTable />
              </div>
              <div className="space-y-6">
                <CostGuardPanel />
                <ConnectivityPolicyPanel />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="user-management">
            <div className="admin-header">
              <h1>User Management</h1>
              <p>Manage user roles and permissions</p>
            </div>
            <div className="user-search-box">
              <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
            <table className="user-table">
              <thead>
                <tr><th>ID</th><th>Username</th><th>Role</th><th>Messages</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>
                      <span className={`user-badge ${user.role}`} onClick={() => openRoleModal(user)} style={{ cursor: admin?.role === 'super_admin' ? 'pointer' : 'default' }}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.message_count}</td>
                    <td>{user.is_banned ? <span className="user-badge banned">Banned</span> : <span className="user-badge user">Active</span>}</td>
                    <td>
                      <div className="action-buttons">
                        {user.role !== 'admin' && user.role !== 'super_admin' && (
                          user.is_banned ? (
                            <button className="action-btn unban" onClick={() => handleUnbanUser(user.id)}>Unban</button>
                          ) : (
                            <button className="action-btn ban" onClick={() => handleBanUser(user.id)}>Ban</button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {showRoleModal && (
              <div className="modal-overlay" onClick={() => setShowRoleModal(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Change Role for {showRoleModal.username}</h2>
                  <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="support">Support</option>
                    {admin?.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                  </select>
                  <div className="modal-actions">
                    <button className="action-btn" onClick={() => setShowRoleModal(null)}>Cancel</button>
                    <button className="action-btn primary" onClick={() => handleRoleChange(showRoleModal.id)}>Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="audit-container">
            <div className="admin-header">
              <h1>Audit Logs</h1>
            </div>
            <div className="audit-list">
              {auditLogs.map(log => (
                <div key={log.id} className="audit-item">
                  <div className="audit-icon">{getActionIcon(log.action)}</div>
                  <div className="audit-content">
                    <div className="audit-action">{log.action}</div>
                    <div className="audit-details">{log.details || 'No details'}</div>
                    <div className="audit-time">By {log.admin_username || 'System'} • {formatTime(log.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="risks-container">
            <div className="admin-header">
              <h1>Risk Alerts & Recommendations</h1>
            </div>

            <div className="status-section">
              <h2><span>🚨</span>Active Risks</h2>
              {risks.length === 0 ? (
                <div className="no-risks">✅ No risks detected</div>
              ) : (
                risks.map((risk, idx) => (
                  <div key={idx} className={`risk-item ${risk.level}`}>
                    <span className="risk-icon">{risk.level === 'warning' ? '⚠️' : 'ℹ️'}</span>
                    <span>{risk.message}</span>
                  </div>
                ))
              )}
            </div>

            <div className="status-section">
              <h2><span>💡</span>Recommended Actions</h2>
              {recommendations.length === 0 ? (
                <div className="no-recommendations">All good — no actions needed</div>
              ) : (
                <div className="recommendations-list">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-item">
                      <div className="rec-action">{rec.action}</div>
                      <div className="rec-desc">{rec.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-container">
            <div className="admin-header">
              <h1>Settings & Permissions</h1>
            </div>
            {permissions && (
              <div className="settings-section">
                <h2>Your Role: {permissions.role}</h2>
                <div className="permissions-list">
                  <h3>Your Permissions:</h3>
                  {permissions.permissions.map(perm => (
                    <div key={perm} className="permission-item">✓ {perm}</div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="settings-section">
              <h2>Data Export</h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>
                Download sanitized backup of all system data (JSON or CSV). Passwords and tokens excluded.
              </p>
              <div className="export-buttons">
                <button
                  className="action-btn"
                  onClick={() => window.open(`${API_URL}/api/admin/export?format=json`, '_blank')}
                >
                  Export JSON
                </button>
                <button
                  className="action-btn"
                  onClick={() => window.open(`${API_URL}/api/admin/export?format=csv`, '_blank')}
                >
                  Export CSV
                </button>
              </div>
            </div>

            <div className="settings-section">
              <h2>Security</h2>
              <button className="action-btn primary" onClick={() => setShowPasswordModal(true)}>
                Change Password
              </button>
            </div>

            {showPasswordModal && (
              <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Change Password</h2>
                  {passwordSuccess ? (
                    <div className="success-message">Password changed successfully!</div>
                  ) : (
                    <>
                      <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                      <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      {passwordError && <div className="error-message">{passwordError}</div>}
                      <div className="modal-actions">
                        <button className="action-btn" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                        <button className="action-btn primary" onClick={handlePasswordChange}>Save</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="communication-container">
            <div className="admin-header">
              <h1>Communication Governance</h1>
              <p>Self-hosted verification & Email gateway controls</p>
            </div>
            <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              <div className="settings-section">
                <EmailSettingsManager authHeader={getAuthHeader()} API_URL={API_URL} />
              </div>
              <div className="settings-section">
                <VerificationLinkTester authHeader={getAuthHeader()} API_URL={API_URL} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'project-brain' && <ProjectBrainDashboard admin={admin} />}

        {activeTab === 'structure-lock' && (
          <div className="structure-lock-container">
            <div className="admin-header">
              <h1>Structure Lock Dashboard</h1>
              <p>Locked system components that must not be modified</p>
            </div>
            
            <div className="status-section">
              <h2><span>🔒</span>Locked Socket Events</h2>
              <div className="lock-list">
                {lockedEvents.map(event => (
                  <div key={event} className="lock-item locked">{event}</div>
                ))}
              </div>
            </div>

            <div className="status-section">
              <h2><span>🔒</span>Locked Files</h2>
              <div className="lock-list">
                {lockedFiles.map(file => (
                  <div key={file} className="lock-item locked">{file}</div>
                ))}
              </div>
            </div>

            <div className="status-section">
              <h2><span>🗄️</span>Database Migrations</h2>
              <div className="migration-list">
                {migrations.map((m, idx) => (
                  <div key={idx} className={`migration-item ${m.exists ? 'success' : 'pending'}`}>
                    <span>{m.name}</span>
                    <span>{m.exists ? '✅' : '⏳'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-container">
            <div className="admin-header">
              <h1>Message Reports</h1>
            </div>
            {reports.length === 0 ? (
              <div className="no-reports">No pending reports</div>
            ) : (
              <div className="reports-list">
                {reports.map(report => (
                  <div key={report.id} className="report-item">
                    <div className="report-content">
                      <div className="report-message">"{report.content}"</div>
                      <div className="report-meta">
                        From: {report.sender_username} | Reported by: {report.reporter_username}
                      </div>
                      <div className="report-reason">Reason: {report.reason}</div>
                    </div>
                    <div className="report-actions">
                      <button className="action-btn" onClick={() => resolveReport(report.id, 'dismissed')}>Dismiss</button>
                      <button className="action-btn ban" onClick={() => resolveReport(report.id, 'user_warned')}>Warn User</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

         {activeTab === 'qa' && (
           <div className="qa-container">
             <QAGate />
           </div>
         )}

         {activeTab === 'project-brain' && (
           <ProjectBrainDashboard />
         )}
      </div>
    </div>
  );
}

export default AdminPanel;
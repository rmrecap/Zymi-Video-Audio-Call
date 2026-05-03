import React, { useState, useEffect } from 'react';
import AdminAdPreviewPanel from './AdminAdPreviewPanel.jsx';
import { API_URL } from '../../config/api.js';
import './AdControlCenter.css';

const AdControlCenter = ({ admin }) => {
  const [config, setConfig] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');
  const [message, setMessage] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [showRollbackModal, setShowRollbackModal] = useState(false);

  const token = localStorage.getItem('adminToken');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchData();
    fetchAudit();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/ad-control/settings`, authHeader);
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format: Expected JSON but received HTML/Text. Route may be misconfigured.");
      }

      const data = await res.json();
      setConfig(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch ad settings:', err);
      setMessage(`Connection Error: ${err.message}`);
      setLoading(false);
    }
  };

  const fetchAudit = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/ad-control/audit`, authHeader);
      
      if (!res.ok) return; // Silent fail for audit in background

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return;

      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  const validateAndExecute = async (payload, executeFn) => {
    try {
      const validatePayload = {
        global: payload.global || config.global,
        networks: payload.networks || config.networks,
        placements: payload.placements || config.placements,
        countryRules: payload.countryRules || config.countryRules,
        versionRules: payload.versionRules || config.versionRules
      };

      const valRes = await fetch(`${API_URL}/api/admin/ad-control/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader.headers },
        body: JSON.stringify(validatePayload)
      });
      
      const validation = await valRes.json();
      if (validation.errors && validation.errors.length > 0) {
        setMessage(`Validation Error: ${validation.errors[0]}`);
        return;
      }
      if (validation.warnings && validation.warnings.length > 0) {
        setWarnings(validation.warnings);
      } else {
        setWarnings([]);
      }
      
      await executeFn();
    } catch (err) {
      console.error('Validation failed', err);
      setMessage('Validation check failed');
    }
  };

  const updateGlobal = async (newSettings) => {
    validateAndExecute({ global: newSettings }, async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/ad-control/global`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader.headers },
          body: JSON.stringify(newSettings)
        });
        if (res.ok) {
          setMessage('Global settings updated successfully');
          fetchData();
          fetchAudit();
        }
      } catch (err) {
        setMessage('Update failed');
      }
    });
  };

  const updateNetwork = async (netConfig) => {
    const newNetworks = config.networks.map(n => n.network_key === netConfig.network_key ? netConfig : n);
    validateAndExecute({ networks: newNetworks }, async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/ad-control/network`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader.headers },
          body: JSON.stringify(netConfig)
        });
        if (res.ok) {
          setMessage(`${netConfig.network_key} updated successfully`);
          fetchData();
          fetchAudit();
        }
      } catch (err) {
        setMessage('Update failed');
      }
    });
  };

  const togglePlacement = async (placement) => {
    const newPlacement = { ...placement, enabled: placement.enabled ? 0 : 1 };
    const newPlacements = config.placements.map(p => p.placement_key === placement.placement_key ? newPlacement : p);
    
    validateAndExecute({ placements: newPlacements }, async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/ad-control/placement`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader.headers },
          body: JSON.stringify(newPlacement)
        });
        if (res.ok) {
          fetchData();
          fetchAudit();
        }
      } catch (err) {
        setMessage('Toggle failed');
      }
    });
  };

  const handleRollback = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/ad-control/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader.headers }
      });
      if (res.ok) {
        setMessage('Rollback successful');
        fetchData();
        fetchAudit();
        setShowRollbackModal(false);
      } else {
        const data = await res.json();
        setMessage(`Rollback failed: ${data.error}`);
        setShowRollbackModal(false);
      }
    } catch (err) {
      setMessage('Rollback failed');
      setShowRollbackModal(false);
    }
  };

  const handleExport = () => {
    window.open(`${API_URL}/api/admin/ad-control/export`, '_blank');
  };

  if (loading) return <div className="zy-loading-placeholder">Loading Ad Control Center...</div>;
  
  if (!config) return (
    <div className="zy-error-card">
      <div className="zy-error-icon">❌</div>
      <h3>Failed to load configuration</h3>
      <p>{message || 'Verify server connectivity.'}</p>
      <div className="zy-error-actions">
        <button className="zy-retry-btn" onClick={() => { setLoading(true); fetchData(); fetchAudit(); }}>
          Retry Connection
        </button>
        <a href={`${API_URL}/api/zrcs/ping`} target="_blank" rel="noopener noreferrer" className="zy-diag-link">
          Run Diagnostics ↗
        </a>
      </div>
    </div>
  );

  return (
    <div className="zy-ad-control-container fadeIn">
      <div className="zy-admin-header-flex">
        <div>
          <h1>Ad Control Center (ZRCS)</h1>
          <p>Remote monetization governance for ZYMI Mobile</p>
        </div>
        <div className={`zy-master-status ${config?.global?.ads_enabled ? 'active' : 'disabled'}`}>
          {config?.global?.ads_enabled ? 'ADS LIVE' : 'ADS KILLED'}
        </div>
      </div>

      <div className="zy-admin-tabs">
        <button className={activeTab === 'global' ? 'active' : ''} onClick={() => setActiveTab('global')}>Global Settings</button>
        <button className={activeTab === 'networks' ? 'active' : ''} onClick={() => setActiveTab('networks')}>Ad Networks</button>
        <button className={activeTab === 'placements' ? 'active' : ''} onClick={() => setActiveTab('placements')}>Placements</button>
        <button className={activeTab === 'preview' ? 'active' : ''} onClick={() => setActiveTab('preview')}>Preview & Policy</button>
        <button className={activeTab === 'contract' ? 'active' : ''} onClick={() => setActiveTab('contract')}>Mobile Contract</button>
        <button className={activeTab === 'rules' ? 'active' : ''} onClick={() => setActiveTab('rules')}>Rules & Geo</button>
        <button className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}>Audit Logs</button>
        <div style={{marginLeft: 'auto', display: 'flex', gap: '10px'}}>
          <button className="zy-admin-btn small" onClick={() => setShowRollbackModal(true)}>Rollback Last Config</button>
          <button className="zy-admin-btn small" onClick={handleExport}>Export Config JSON</button>
        </div>
      </div>

      {message && <div className="zy-admin-toast" onClick={() => setMessage('')}>{message}</div>}
      {warnings.length > 0 && (
        <div className="zy-admin-toast warning" onClick={() => setWarnings([])}>
          Warnings: {warnings.join(' | ')}
        </div>
      )}

      {showRollbackModal && (
        <div className="zy-modal-overlay">
          <div className="zy-modal-content glass">
            <h2>Confirm Rollback</h2>
            <p>Are you sure you want to rollback to the previous configuration? This action is highly sensitive.</p>
            <div className="zy-modal-actions">
              <button className="zy-admin-btn" onClick={() => setShowRollbackModal(false)}>Cancel</button>
              <button className="zy-admin-btn danger" onClick={handleRollback}>Yes, Rollback Last Config</button>
            </div>
          </div>
        </div>
      )}

      <div className="zy-ad-content">
        {activeTab === 'global' && (
          <div className="zy-admin-section glass">
            <h2>Master Controls</h2>
            <div className="zy-admin-grid">
              <div className="zy-control-card">
                <label>Kill Switch</label>
                <button 
                  className={`zy-admin-btn ${config.global.ads_enabled ? 'danger' : 'success'}`}
                  onClick={() => updateGlobal({ ...config.global, ads_enabled: config.global.ads_enabled ? 0 : 1 })}
                >
                  {config.global.ads_enabled ? 'Emergency Kill Ads' : 'Enable Ads System'}
                </button>
              </div>
              <div className="zy-control-card">
                <label>Test Mode</label>
                <div className="zy-toggle-wrap">
                  <span>Show Test Ads</span>
                  <input 
                    type="checkbox" 
                    checked={!!config.global.test_mode} 
                    onChange={(e) => updateGlobal({ ...config.global, test_mode: e.target.checked ? 1 : 0 })}
                  />
                </div>
              </div>
              <div className="zy-control-card">
                <label>Active Network</label>
                <select 
                  value={config.global.active_network}
                  onChange={(e) => updateGlobal({ ...config.global, active_network: e.target.value })}
                >
                  {config.networks.map(n => <option key={n.network_key} value={n.network_key}>{n.network_key.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="zy-control-card">
                <label>Interstitial Gap (Seconds)</label>
                <input 
                  type="number" 
                  value={config.global.interstitial_gap_seconds}
                  onChange={(e) => updateGlobal({ ...config.global, interstitial_gap_seconds: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'networks' && (
          <div className="zy-networks-list">
            {config.networks.map(net => (
              <div key={net.network_key} className="zy-network-card glass">
                <div className="zy-card-header">
                  <h3>{net.network_key.toUpperCase()}</h3>
                  <div className={`zy-badge ${net.is_active ? 'active' : ''}`}>{net.is_active ? 'ENABLED' : 'DISABLED'}</div>
                </div>
                <div className="zy-admin-form">
                  <div className="field">
                    <label>App ID</label>
                    <input 
                      value={net.app_id || ''} 
                      onChange={(e) => {
                        const newNet = {...net, app_id: e.target.value};
                        const newConfigs = config.networks.map(n => n.network_key === net.network_key ? newNet : n);
                        setConfig({...config, networks: newConfigs});
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Interstitial Unit ID</label>
                    <input 
                      value={net.interstitial_id || ''} 
                      onChange={(e) => {
                        const newNet = {...net, interstitial_id: e.target.value};
                        const newConfigs = config.networks.map(n => n.network_key === net.network_key ? newNet : n);
                        setConfig({...config, networks: newConfigs});
                      }}
                    />
                  </div>
                  <div className="field">
                    <label>Native Unit ID</label>
                    <input 
                      value={net.native_id || ''} 
                      onChange={(e) => {
                        const newNet = {...net, native_id: e.target.value};
                        const newConfigs = config.networks.map(n => n.network_key === net.network_key ? newNet : n);
                        setConfig({...config, networks: newConfigs});
                      }}
                    />
                  </div>
                  <button className="zy-admin-btn primary small" onClick={() => updateNetwork(net)}>Save {net.network_key} Config</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'placements' && (
          <div className="zy-admin-section glass">
            <h2>Placement Controls</h2>
            <div className="zy-placement-grid">
              {config.placements.map(p => (
                <div key={p.placement_key} className="zy-placement-card">
                  <div className="info">
                    <span className="key">{p.placement_key.replace(/_/g, ' ')}</span>
                    <span className="status">{p.enabled ? 'Live' : 'Hidden'}</span>
                  </div>
                  <button 
                    className={`zy-toggle-btn ${p.enabled ? 'active' : ''}`}
                    onClick={() => togglePlacement(p)}
                  >
                    {p.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <AdminAdPreviewPanel config={config} />
        )}

        {activeTab === 'contract' && (
          <div className="zy-admin-section glass">
            <h2>Mobile Integration Contract (ZRCS v1)</h2>
            <div className="zy-contract-grid">
              <div className="zy-contract-card">
                <h3>🔄 Startup & Cache</h3>
                <ul>
                  <li><strong>TTL:</strong> 4-Hour local cache required.</li>
                  <li><strong>Fallback:</strong> If API fails, use cache. If no cache, Ads = OFF.</li>
                  <li><strong>Active Sync:</strong> Re-fetch on every app launch (background).</li>
                </ul>
              </div>
              <div className="zy-contract-card">
                <h3>🚫 Ad Block States</h3>
                <ul>
                  <li><strong>Call Active:</strong> Strictly NO ADS during signaling/calls.</li>
                  <li><strong>Composer:</strong> No banners/native ads near active keyboard.</li>
                  <li><strong>Cleanup:</strong> Call-end ads only after <code>cleanupCall()</code>.</li>
                </ul>
              </div>
              <div className="zy-contract-card">
                <h3>📦 API Response Sample</h3>
                <pre className="zy-mini-code">
{`{
  "ads_enabled": true,
  "test_mode": true,
  "active_network": "admob",
  "safe_intervals": {
    "app_open_seconds": 14400,
    "call_end_interstitial_seconds": 1800
  },
  "placements": { "app_open": true, ... }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="zy-admin-section glass">
            <h2>Audit History</h2>
            <div className="zy-audit-table-wrapper">
              <table className="zy-audit-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Section</th>
                    <th>Risk</th>
                    <th>Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.admin_name}</td>
                      <td><span className="zy-badge-outline">{log.action}</span></td>
                      <td>{log.changed_section}</td>
                      <td>
                        <span className={`zy-badge-risk ${log.risk_level?.toLowerCase()}`}>
                          {log.risk_level}
                        </span>
                      </td>
                      <td>
                        <div className="zy-audit-diff">
                          {log.old_value && <div className="old">OLD: {log.old_value}</div>}
                          {log.new_value && <div className="new">NEW: {log.new_value}</div>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdControlCenter;

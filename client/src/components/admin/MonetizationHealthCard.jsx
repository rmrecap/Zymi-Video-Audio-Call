import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const MonetizationHealthCard = ({ authHeader, API_URL }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      // Fetch settings
      const res = await fetch(`${API_URL}/api/admin/ad-control/settings`, authHeader);
      if (!res.ok) throw new Error('Failed to fetch settings');
      const config = await res.json();
      
      // Fetch audit logs for last rollback
      const auditRes = await fetch(`${API_URL}/api/admin/ad-control/audit`, authHeader);
      let lastRollback = 'Never';
      if (auditRes.ok) {
        const logs = await auditRes.json();
        const rollbackLog = logs.find(log => log.action === 'AD_CONFIG_ROLLBACK');
        if (rollbackLog) {
          lastRollback = new Date(rollbackLog.timestamp).toLocaleString();
        }
      }
      
      // Validate config
      const validateRes = await fetch(`${API_URL}/api/admin/ad-control/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader.headers },
        body: JSON.stringify(config)
      });
      let warningCount = 0;
      if (validateRes.ok) {
        const validation = await validateRes.json();
        warningCount = (validation.warnings?.length || 0) + (validation.errors?.length || 0);
      }

      setData({
        enabled: config.global.ads_enabled,
        activeNetwork: config.global.active_network,
        testMode: config.global.test_mode,
        warningCount,
        lastUpdated: new Date(config.global.updated_at).toLocaleString(),
        lastRollback
      });
      setLoading(false);
    } catch (err) {
      console.error('Monetization card fetch error:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [authHeader, API_URL]);

  const runHealthCheck = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/ad-settings/health`);
      if (res.ok) {
        const result = await res.json();
        setHealthStatus(result);
        setTimeout(() => setHealthStatus(null), 5000);
      }
    } catch (err) {
      console.error('Health check failed', err);
    }
  };

  if (loading) return <div className="stat-card loading" style={{ gridColumn: 'span 2' }}>Loading ZRCS V2 Health...</div>;
  if (!data) return null;

  return (
    <div className={`stat-card monetization ${data.enabled ? 'active' : 'disabled'}`} style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-icon">💰</div>
          <div className="stat-value">{data.enabled ? 'Ads Live' : 'Ads Off'}</div>
          <div className="stat-label">
            {data.activeNetwork.toUpperCase()} 
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="stat-meta" style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', marginBottom: '10px' }}>
            {data.testMode ? <span className="badge test">TEST MODE</span> : <span className="badge live">LIVE</span>}
            {data.warningCount > 0 && <span className="badge warn">⚠️ {data.warningCount} Issues</span>}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Last Update: {data.lastUpdated}<br/>
            Last Rollback: {data.lastRollback}
          </div>
        </div>
      </div>

      {healthStatus && (
        <div style={{ background: '#1e293b', padding: '8px', borderRadius: '4px', fontSize: '12px', borderLeft: '3px solid #10b981' }}>
          <strong>API Health:</strong> {healthStatus.status.toUpperCase()} | <strong>Contract:</strong> {healthStatus.contract_version}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
        <button 
          onClick={() => navigate('/exclusivesecure/ads')}
          style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
        >
          Open Ad Control
        </button>
        <button 
          onClick={runHealthCheck}
          style={{ flex: 1, padding: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px', cursor: 'pointer' }}
        >
          Run ZRCS Health Check
        </button>
      </div>
    </div>
  );
};

export default MonetizationHealthCard;

import { useState, useEffect } from 'react';

function EmailSettingsManager({ authHeader, API_URL }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/email-settings`, authHeader);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        setError('Failed to fetch email settings');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/email-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader.headers },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSuccess('Settings updated successfully');
        fetchSettings();
      } else {
        const data = await res.json();
        setError(data.error || 'Update failed');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setTesting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_URL}/api/admin/email-settings/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader.headers },
        body: JSON.stringify({ testEmail })
      });
      if (res.ok) {
        setSuccess('Test email sent successfully');
      } else {
        const data = await res.json();
        setError(data.error || 'Test failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div>Loading email settings...</div>;

  return (
    <div className="email-settings-manager">
      <h3>Email Provider Configuration</h3>
      <form onSubmit={handleUpdate} className="admin-form">
        <div className="form-group">
          <label>Provider</label>
          <select 
            value={settings?.provider || 'gmail'} 
            onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
          >
            <option value="gmail">Gmail (App Password)</option>
            <option value="smtp">Custom SMTP</option>
          </select>
        </div>

        {settings?.provider === 'gmail' ? (
          <>
            <div className="form-group">
              <label>Gmail User</label>
              <input 
                type="email" 
                value={settings.gmail_user || ''} 
                onChange={(e) => setSettings({ ...settings, gmail_user: e.target.value })} 
                placeholder="user@gmail.com"
              />
            </div>
            <div className="form-group">
              <label>Gmail App Password</label>
              <input 
                type="password" 
                value={settings.gmail_app_password || ''} 
                onChange={(e) => setSettings({ ...settings, gmail_app_password: e.target.value })} 
                placeholder="Enter new app password to update"
              />
              <small style={{ color: '#64748b' }}>Generate at Google Account {'>'} Security {'>'} App Passwords</small>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>SMTP Host</label>
              <input 
                type="text" 
                value={settings.smtp_host || ''} 
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })} 
                placeholder="smtp.example.com"
              />
            </div>
            <div className="form-group">
              <label>SMTP Port</label>
              <input 
                type="number" 
                value={settings.smtp_port || 587} 
                onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })} 
              />
            </div>
            <div className="form-group">
              <label>SMTP User</label>
              <input 
                type="text" 
                value={settings.smtp_user || ''} 
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })} 
              />
            </div>
            <div className="form-group">
              <label>SMTP Password</label>
              <input 
                type="password" 
                value={settings.smtp_pass || ''} 
                onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })} 
                placeholder="Enter new password to update"
              />
            </div>
            <div className="form-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={settings.smtp_secure === 1} 
                  onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked ? 1 : 0 })}
                />
                Use SSL/TLS (Port 465)
              </label>
            </div>
          </>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" className="action-btn primary">Save Email Settings</button>
      </form>

      <div className="test-email-section" style={{ marginTop: '30px', borderTop: '1px solid #ffffff11', paddingTop: '20px' }}>
        <h3>Test Email Connection</h3>
        <div className="form-group">
          <input 
            type="email" 
            placeholder="test@example.com" 
            value={testEmail} 
            onChange={(e) => setTestEmail(e.target.value)} 
          />
          <button 
            className="action-btn" 
            onClick={handleTest} 
            disabled={testing || !testEmail}
          >
            {testing ? 'Sending...' : 'Send Test OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailSettingsManager;

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const PROVIDERS = [
  { value: 'smtp', label: 'SMTP' },
  { value: 'gmail', label: 'Gmail API' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'mailgun', label: 'Mailgun' }
];

export default function GatewayPage() {
  const [tab, setTab] = useState('email');
  const [emailSettings, setEmailSettings] = useState(null);
  const [smsSettings, setSmsSettings] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [e, s, h] = await Promise.all([
        api.get('/api/admin/email-settings').catch(() => ({ data: null })),
        api.get('/api/admin/sms-settings').catch(() => ({ data: null })),
        api.get('/api/admin/gateway-health').catch(() => ({ data: null }))
      ]);
      setEmailSettings(e.data);
      setSmsSettings(s.data);
      setHealth(h.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveEmail = async () => {
    setSaving(true);
    try {
      await api.post('/api/admin/email-settings', emailSettings);
      await fetchAll();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const saveSms = async () => {
    setSaving(true);
    try {
      await api.post('/api/admin/sms-settings', smsSettings);
      await fetchAll();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setTestStatus('sending');
    try {
      await api.post('/api/admin/email-settings/test', { testEmail });
      setTestStatus('sent');
    } catch (e) {
      setTestStatus('failed');
      console.error(e);
    }
    setTimeout(() => setTestStatus(''), 4000);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-cyber-accent font-mono animate-pulse">⟳ LOADING GATEWAY CONFIG...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-mono text-white">◈ External Gateway Infrastructure</h2>
        <button onClick={fetchAll} className="px-4 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">⟳ REFRESH</button>
      </div>

      <div className="flex gap-1 border-b border-cyber-border">
        {['email', 'sms', 'health'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${tab === t ? 'text-cyber-accent border-b-2 border-cyber-accent' : 'text-white/40 hover:text-white/70'}`}>
            {t === 'email' ? 'Email / SMTP' : t === 'sms' ? 'SMS Gateway' : 'Health & Status'}
          </button>
        ))}
      </div>

      {tab === 'email' && (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-mono text-cyber-accent">Email Delivery Configuration</h3>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Provider</label>
            <select value={emailSettings?.provider || 'smtp'}
              onChange={e => setEmailSettings(prev => ({ ...prev, provider: e.target.value }))}
              className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-mono">
              {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {(emailSettings?.provider === 'smtp' || !emailSettings?.provider) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="SMTP Host" value={emailSettings?.smtp_host || ''} onChange={v => setEmailSettings(prev => ({ ...prev, smtp_host: v }))} />
              <Field label="SMTP Port" value={emailSettings?.smtp_port || 587} onChange={v => setEmailSettings(prev => ({ ...prev, smtp_port: parseInt(v) || 587 }))} type="number" />
              <Field label="SMTP User" value={emailSettings?.smtp_user || ''} onChange={v => setEmailSettings(prev => ({ ...prev, smtp_user: v }))} />
              <Field label="SMTP Password" value={emailSettings?.smtp_pass || ''} onChange={v => setEmailSettings(prev => ({ ...prev, smtp_pass: v }))} type="password" />
              <div className="flex items-center gap-3">
                <label className="text-xs font-mono text-white/60">Secure (TLS)</label>
                <input type="checkbox" checked={!!emailSettings?.smtp_secure}
                  onChange={e => setEmailSettings(prev => ({ ...prev, smtp_secure: e.target.checked }))}
                  className="accent-cyber-accent" />
              </div>
            </div>
          )}

          {emailSettings?.provider === 'gmail' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Gmail User" value={emailSettings?.gmail_user || ''} onChange={v => setEmailSettings(prev => ({ ...prev, gmail_user: v }))} />
              <Field label="App Password" value={emailSettings?.gmail_app_password || ''} onChange={v => setEmailSettings(prev => ({ ...prev, gmail_app_password: v }))} type="password" />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={saveEmail} disabled={saving}
              className="px-6 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">
              {saving ? '⟳ SAVING...' : 'SAVE EMAIL CONFIG'}
            </button>

            <div className="flex items-center gap-2">
              <input placeholder="test@example.com" value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs font-mono w-48" />
              <button onClick={handleTest} disabled={!testEmail || testStatus === 'sending'}
                className="px-4 py-2 text-xs font-mono text-cyber-amber border border-cyber-amber/30 rounded-lg hover:bg-cyber-amber/10">
                {testStatus === 'sending' ? '⟳' : testStatus === 'sent' ? '✓ SENT' : testStatus === 'failed' ? '✗ FAILED' : 'TEST'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'sms' && (
        <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-mono text-cyber-accent">SMS Gateway Configuration</h3>

          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-white/60">Gateway Enabled</span>
            <button onClick={() => setSmsSettings(prev => ({ ...prev, enabled: !prev?.enabled }))}
              className={`w-10 h-5 rounded-full transition-all ${smsSettings?.enabled ? 'bg-cyber-green' : 'bg-white/20'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-all ${smsSettings?.enabled ? 'ml-5' : 'ml-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Provider</label>
            <select value={smsSettings?.provider || 'twilio'}
              onChange={e => setSmsSettings(prev => ({ ...prev, provider: e.target.value, config: prev?.config || {} }))}
              className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-mono">
              <option value="twilio">Twilio</option>
              <option value="infobip">Infobip</option>
              <option value="vonage">Vonage (Nexmo)</option>
              <option value="custom">Custom SMSC</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Account SID / API Key" value={smsSettings?.config?.accountSid || ''}
              onChange={v => setSmsSettings(prev => ({ ...prev, config: { ...prev?.config, accountSid: v } }))} />
            <Field label="Auth Token" value={smsSettings?.config?.authToken || ''}
              onChange={v => setSmsSettings(prev => ({ ...prev, config: { ...prev?.config, authToken: v } }))} type="password" />
            <Field label="From Number / Sender ID" value={smsSettings?.config?.fromNumber || ''}
              onChange={v => setSmsSettings(prev => ({ ...prev, config: { ...prev?.config, fromNumber: v } }))} />
            <Field label="API Base URL" value={smsSettings?.config?.apiBaseUrl || ''}
              onChange={v => setSmsSettings(prev => ({ ...prev, config: { ...prev?.config, apiBaseUrl: v } }))} />
          </div>

          <button onClick={saveSms} disabled={saving}
            className="px-6 py-2 text-xs font-mono text-cyber-accent border border-cyber-accent/30 rounded-lg hover:bg-cyber-accent/10">
            {saving ? '⟳ SAVING...' : 'SAVE SMS CONFIG'}
          </button>
        </div>
      )}

      {tab === 'health' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-mono text-cyber-accent">Email Gateway Health</h3>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Status</span>
              <span className={health?.email?.configured ? 'text-cyber-green' : 'text-cyber-amber'}>
                {health?.email?.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
              </span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Provider</span>
              <span className="text-cyber-accent">{health?.email?.provider || 'none'}</span>
            </div>
            <p className="text-[10px] font-mono text-white/30 mt-4">Delivery metrics and success ratios will appear here once email traffic flows through the system.</p>
          </div>
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-mono text-cyber-accent">SMS Gateway Health</h3>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Status</span>
              <span className={health?.sms?.configured ? 'text-cyber-green' : 'text-cyber-amber'}>
                {health?.sms?.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
              </span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Provider</span>
              <span className="text-cyber-accent">{health?.sms?.provider || 'none'}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/50">Enabled</span>
              <span className={health?.sms?.enabled ? 'text-cyber-green' : 'text-cyber-red'}>{health?.sms?.enabled ? 'YES' : 'NO'}</span>
            </div>
          </div>
          <div className="bg-cyber-card border border-cyber-border rounded-xl p-6 col-span-full">
            <h3 className="text-sm font-mono text-cyber-accent mb-2">Outbound Payload Log (Recent)</h3>
            <p className="text-[10px] font-mono text-white/30">Real-time gateway logging will be displayed here. Configure email/SMS above to begin tracking.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-xs font-mono mt-1" />
    </div>
  );
}

import { useState } from 'react';

function VerificationLinkTester({ authHeader, API_URL }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');
  const [error, setError] = useState('');

  const generateTestLink = async () => {
    if (!phone) return;
    setLoading(true);
    setError('');
    setLink('');
    try {
      const res = await fetch(`${API_URL}/api/otp/phone/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader.headers },
        body: JSON.stringify({
          phone,
          countryCode: '+880',
          countryName: 'Bangladesh',
          phoneCountryIso: 'BD'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLink(data.link);
      } else {
        setError(data.error || 'Failed to generate link');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verification-tester">
      <h3>Phone Verification Link Tester</h3>
      <p style={{ color: '#64748b', fontSize: '13px' }}>Generate a self-hosted verification link for testing purposes.</p>
      <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="01712345678" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
        />
        <button className="action-btn" onClick={generateTestLink} disabled={loading || !phone}>
          {loading ? 'Generating...' : 'Generate Link'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {link && (
        <div className="test-result" style={{ marginTop: '15px' }}>
          <div style={{ padding: '10px', background: '#00000044', borderRadius: '5px', wordBreak: 'break-all', border: '1px solid #3b82f633', fontSize: '12px', color: '#3b82f6' }}>
            {link}
          </div>
          <button 
            className="action-btn" 
            style={{ marginTop: '10px', width: '100%' }}
            onClick={() => window.open(link, '_blank')}
          >
            Open in New Tab
          </button>
        </div>
      )}
    </div>
  );
}

export default VerificationLinkTester;

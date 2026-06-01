import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config/api';
import './UserProfileModal.css';

const UserProfileModal = ({ user, onClose, onUpdate }) => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    statusText: '',
    address: '',
    work: '',
    hobby: '',
    familyMembers: [],
    selectedServer: 'Default',
    premiumStatus: 'free'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('zymi_token');
      const res = await fetch(`${API_URL}/api/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          displayName: data.displayName || '',
          statusText: data.statusText || '',
          address: data.address || '',
          work: data.work || '',
          hobby: data.hobby || '',
          familyMembers: data.familyMembers || [],
          selectedServer: data.selectedServer || 'Default',
          premiumStatus: data.premiumStatus || 'free'
        });
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('zymi_token');
      const res = await fetch(`${API_URL}/api/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        const result = await res.json();
        onUpdate(result);
        onClose();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const addFamilyMember = () => {
    if (newFamilyMember.trim()) {
      setProfile(prev => ({
        ...prev,
        familyMembers: [...prev.familyMembers, newFamilyMember.trim()]
      }));
      setNewFamilyMember('');
    }
  };

  const removeFamilyMember = (index) => {
    setProfile(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
  };

  if (loading) return null;

  return (
    <div className="zy-profile-modal-overlay" onClick={onClose}>
      <div className="zy-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="zy-profile-header">
          <h2>User Profile & Settings</h2>
          <button className="zy-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="zy-profile-body">
          <div className="zy-profile-section">
            <h3>Personal Information</h3>
            <div className="zy-form-row">
              <div className="zy-form-group">
                <label>First Name</label>
                <input 
                  type="text" 
                  value={profile.firstName} 
                  onChange={e => setProfile({...profile, firstName: e.target.value})}
                  placeholder="First Name"
                />
              </div>
              <div className="zy-form-group">
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={profile.lastName} 
                  onChange={e => setProfile({...profile, lastName: e.target.value})}
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="zy-form-group">
              <label>Display Name</label>
              <input 
                type="text" 
                value={profile.displayName} 
                onChange={e => setProfile({...profile, displayName: e.target.value})}
                placeholder="Display Name"
              />
            </div>
            <div className="zy-form-group">
              <label>Status</label>
              <input 
                type="text" 
                value={profile.statusText} 
                onChange={e => setProfile({...profile, statusText: e.target.value})}
                placeholder="What's on your mind?"
              />
            </div>
          </div>

          <div className="zy-profile-section">
            <h3>Contact & Details</h3>
            <div className="zy-form-group">
              <label>Address</label>
              <textarea 
                value={profile.address} 
                onChange={e => setProfile({...profile, address: e.target.value})}
                placeholder="Your address"
              />
            </div>
            <div className="zy-form-row">
              <div className="zy-form-group">
                <label>Work</label>
                <input 
                  type="text" 
                  value={profile.work} 
                  onChange={e => setProfile({...profile, work: e.target.value})}
                  placeholder="Occupation"
                />
              </div>
              <div className="zy-form-group">
                <label>Hobby</label>
                <input 
                  type="text" 
                  value={profile.hobby} 
                  onChange={e => setProfile({...profile, hobby: e.target.value})}
                  placeholder="Your interests"
                />
              </div>
            </div>
          </div>

          <div className="zy-profile-section">
            <h3>Family Members</h3>
            <div className="zy-family-input">
              <input 
                type="text" 
                value={newFamilyMember} 
                onChange={e => setNewFamilyMember(e.target.value)}
                placeholder="Add family member"
              />
              <button onClick={addFamilyMember}>Add</button>
            </div>
            <div className="zy-family-list">
              {profile.familyMembers.map((member, idx) => (
                <div key={idx} className="zy-family-tag">
                  {member}
                  <span onClick={() => removeFamilyMember(idx)}>&times;</span>
                </div>
              ))}
            </div>
          </div>

          <div className="zy-profile-section">
            <h3>Account Verifications</h3>
            <div className="zy-verify-item">
              <span>Email: {user.email || 'Not set'}</span>
              {user.email_verified ? <span className="zy-verified">Verified</span> : <button className="zy-verify-btn">Verify Now</button>}
            </div>
            <div className="zy-verify-item">
              <span>Phone: {user.phone || 'Not set'}</span>
              {user.phone_verified ? <span className="zy-verified">Verified</span> : <button className="zy-verify-btn">Verify Now</button>}
            </div>
          </div>

          <div className="zy-profile-section">
            <h3>Network & Subscription</h3>
            <div className="zy-form-group">
              <label>Network Server</label>
              <select 
                value={profile.selectedServer} 
                onChange={e => setProfile({...profile, selectedServer: e.target.value})}
              >
                <option value="Default">Default Server (Optimized)</option>
                <option value="Middle East">Middle East (Dubai)</option>
                <option value="Europe">Europe (Frankfurt)</option>
                <option value="Asia">Asia (Singapore)</option>
              </select>
            </div>
            <div className="zy-premium-box">
              <div className="zy-premium-info">
                <span>Status: <strong className={profile.premiumStatus}>{profile.premiumStatus.toUpperCase()}</strong></span>
                <p>Unlock premium features like 4K video calls and large file transfers.</p>
              </div>
              {profile.premiumStatus === 'free' && <button className="zy-upgrade-btn">Upgrade to Premium</button>}
            </div>
          </div>
        </div>

        <div className="zy-profile-footer">
          <button className="zy-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="zy-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;

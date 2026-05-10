import React from 'react';
import './PremiumChatSidebar.css';

const PremiumChatSidebar = ({
  users,
  selectedUser,
  onSelectUser,
  searchQuery,
  onSearchChange,
  onlineUsers,
  typingUsers,
  lastMessagePreview,
  unreadCounts,
  currentUser,
  activeView = 'chats',
  onLogout = () => {},
  onViewChange = () => {}
}) => {
  const filteredUsers = users.filter(user =>
    ((user.name || user.username) || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const renderLastMessage = (user) => {
    const preview = lastMessagePreview[user.id];
    if (!preview) return 'Start a conversation';

    if (typeof preview === 'object' && preview.mediaType) {
      switch (preview.mediaType) {
        case 'image': return '📷 Photo';
        case 'video': return '🎥 Video';
        case 'document': return '📄 Document';
        case 'location': return '📍 Location';
        default: return '📎 File';
      }
    }

    const content = typeof preview === 'object' ? preview.content : preview;
    return content?.slice(0, 35) + (content?.length > 35 ? '...' : '');
  };

  return (
    <div className="zy-premium-sidebar">
      <div className="zy-sidebar-header">
        <div className="zy-sidebar-profile">
          <div className="zy-profile-avatar-wrapper">
            <div className="zy-profile-avatar">
              {currentUser.username?.[0].toUpperCase() || 'U'}
            </div>
            <div className="zy-profile-status-ring" />
          </div>
          <div className="zy-profile-info">
            <h2 className="zy-profile-name">ZYMI</h2>
            <p className="zy-profile-status">Premium Chat</p>
          </div>
        </div>
        <div className="zy-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="zy-new-chat-btn" title="New Message">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="zy-logout-btn" title="Logout" onClick={onLogout} style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: 'none',
            borderRadius: '10px',
            color: '#ef4444',
            padding: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>

      <div className="zy-sidebar-search">
        <div className="zy-search-box">
          <svg className="zy-search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search messages or people..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="zy-sidebar-nav">
        <button 
          className={`zy-nav-item ${activeView === 'chats' ? 'active' : ''}`}
          onClick={() => onViewChange('chats')}
        >
          Chats
        </button>
        <button 
          className={`zy-nav-item ${activeView === 'nearby' ? 'active' : ''}`}
          onClick={() => onViewChange('nearby')}
        >
          Nearby
        </button>
        <button className="zy-nav-item">Status</button>
        <button className="zy-nav-item">Calls</button>
      </div>

      <div className="zy-sidebar-content">
        <div className="zy-users-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div
                key={user.id}
                className={`zy-user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                onClick={() => onSelectUser(user)}
              >
                <div className="zy-user-avatar-area">
                  <div className="zy-user-avatar">
                    {user.avatar ? <img src={user.avatar} alt="" /> : (user.name || user.username)[0].toUpperCase()}
                  </div>
                  {onlineUsers[user.id] && <div className="zy-online-indicator" />}
                </div>

                <div className="zy-user-details">
                  <div className="zy-user-row">
                    <h3 className="zy-user-name">{user.name || user.username}</h3>
                    <span className="zy-user-time">
                      {lastMessagePreview[user.id]?.timestamp ? 
                        new Date(lastMessagePreview[user.id].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                        : ''}
                    </span>
                  </div>
                  <div className="zy-user-row">
                    <p className={`zy-user-preview ${typingUsers[user.id] ? 'typing' : ''}`}>
                      {typingUsers[user.id] ? 'Typing...' : renderLastMessage(user)}
                    </p>
                    {unreadCounts[user.id] > 0 && (
                      <span className="zy-unread-count">{unreadCounts[user.id]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="zy-empty-search">
              <p>No results found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumChatSidebar;
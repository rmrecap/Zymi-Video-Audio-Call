function ChatSidebar({ currentUser, users, selectedUser, searchQuery, onSearchChange, onSelectUser, onShowProfile, showProfile, onLogout, onlineUsers, typingUsers }) {
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (!isToday && !isYesterday) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    if (isYesterday) return 'yesterday';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = users.filter(u => !searchQuery || (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="sidebar">
      <div className="sidebar-header" onClick={onShowProfile}>
        <div className="user-avatar">{currentUser.username[0].toUpperCase()}</div>
        <span className="user-name">{currentUser.username}</span>
      </div>

      <div className="user-search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={onSearchChange}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => onSearchChange({ target: { value: '' } })}>×</button>
        )}
      </div>

      <div className="users-list">
        {!currentUser ? (
          <div className="loading-state">Loading contacts...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">{searchQuery ? 'No contacts found' : 'No chats yet'}</div>
        ) : (
          filteredUsers.map(u => (
            <div
              key={u.id}
              className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
              onClick={() => onSelectUser(u)}
            >
              <div className="user-avatar">{u.username[0].toUpperCase()}</div>
              {onlineUsers[u.id] && <div className="user-online-dot" />}
              <div className="user-info">
                <div className="user-row">
                  <span className="user-name">{u.username}</span>
                  <span className="user-time">{onlineUsers[u.id] ? 'now' : ''}</span>
                </div>
                <div className="user-preview">
                  {typingUsers[u.id] ? (
                    <span className="typing-text">typing...</span>
                  ) : (
                    <span>Click to start chatting</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showProfile && (
        <div className="profile-modal" onClick={onShowProfile}>
          <div className="profile-content" onClick={e => e.stopPropagation()}>
            <div className="profile-avatar">{currentUser.username[0].toUpperCase()}</div>
            <div className="profile-name">@{currentUser.username}</div>
            <div className="profile-id">ID: {currentUser.id}</div>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatSidebar;
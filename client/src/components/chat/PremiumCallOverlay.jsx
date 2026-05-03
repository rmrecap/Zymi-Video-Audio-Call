import React from 'react';
import './PremiumCallOverlay.css';

const PremiumCallOverlay = ({
  localVideoRef,
  remoteVideoRef,
  callStatus,
  callType,
  selectedUser,
  incomingCall,
  isMuted,
  isVideoOff,
  onEndCall,
  onToggleMute,
  onToggleCamera
}) => {
  const isVideo = callType === 'video';
  if (callStatus === 'idle') return null;

  const getCallerName = () => {
    if (selectedUser?.username) return selectedUser.username;
    if (incomingCall?.fromName) return incomingCall.fromName;
    if (incomingCall?.caller?.username) return incomingCall.caller.username;
    return 'User';
  };

  const getStatusLabel = () => {
    switch (callStatus) {
      case 'ringing': return 'RINGING';
      case 'connecting': return 'CONNECTING';
      case 'reconnecting': return 'RECONNECTING';
      case 'connected': return isVideo ? 'VIDEO CALL' : 'VOICE CALL';
      case 'ended': return 'CALL ENDED';
      case 'failed': return 'CALL FAILED';
      default: return isVideo ? 'VIDEO CALL' : 'VOICE CALL';
    }
  };

  return (
    <div className={`zy-call-overlay-screen ${isVideo ? 'video' : 'audio'}`}>
      <div className="zy-call-background">
        {isVideo ? (
          <video ref={remoteVideoRef} className="zy-remote-video" autoPlay playsInline />
        ) : (
          <div className="zy-audio-bg-glow" />
        )}
      </div>

      <div className="zy-call-header-floating">
        <div className="zy-call-user-card-glass">
          <div className="zy-call-mini-avatar">
            {(selectedUser?.avatar || incomingCall?.caller?.avatar) ? (
              <img src={selectedUser?.avatar || incomingCall?.caller?.avatar} alt="" />
            ) : (
              getCallerName()[0].toUpperCase()
            )}
          </div>
          <div className="zy-call-info-stack">
            <h2 className="zy-call-target-name">{getCallerName()}</h2>
            <p className="zy-call-status-badge">{getStatusLabel()}</p>
          </div>
        </div>
      </div>

      {isVideo && !isVideoOff && (
        <div className="zy-local-video-window">
          <video ref={localVideoRef} className="zy-local-video" autoPlay playsInline muted />
        </div>
      )}

      {!isVideo && (
        <div className="zy-audio-call-center">
          <div className="zy-audio-avatar-large">
            {(selectedUser?.avatar || incomingCall?.caller?.avatar) ? (
              <img src={selectedUser?.avatar || incomingCall?.caller?.avatar} alt="" />
            ) : (
              getCallerName()[0].toUpperCase()
            )}
            <div className="zy-audio-waves">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      <div className="zy-call-controls-bar">
        <div className="zy-controls-glass">
          <button className={`zy-control-btn ${isMuted ? 'active' : ''}`} onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMuted ? (
                <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
              ) : (
                <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              )}
            </svg>
          </button>

          {isVideo && (
            <button className={`zy-control-btn ${isVideoOff ? 'active' : ''}`} onClick={onToggleCamera} title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                {isVideoOff ? (
                  <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10M1 1l22 22" />
                ) : (
                  <>
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </>
                )}
              </svg>
            </button>
          )}

          <button className="zy-control-btn end-call" onClick={onEndCall} title="End Call">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" style={{ transform: 'rotate(135deg)', transformOrigin: 'center' }} />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumCallOverlay;
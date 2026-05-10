import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket, useConnectionStatus } from '../socket/SocketContext.jsx';
import { useCrossTabSync } from '../hooks/useCrossTabSync.js';
import CallTimeoutNotice from './calls/CallTimeoutNotice.jsx';
import CallOverlay from './CallOverlay.jsx';
import PremiumCallOverlay from './chat/PremiumCallOverlay.jsx';
import PremiumIncomingCallModal from './chat/PremiumIncomingCallModal.jsx';
import PremiumChatHeader from './chat/PremiumChatHeader.jsx';
import PremiumMessageList from './chat/PremiumMessageList.jsx';
import PremiumMessageComposer from './chat/PremiumMessageComposer.jsx';
import PremiumChatSidebar from './chat/PremiumChatSidebar.jsx';
import MobileChatHome from './chat/MobileChatHome.jsx';
import ContactProfilePanel from './chat/ContactProfilePanel.jsx';
import PremiumChatShell from './chat/PremiumChatShell.jsx';
import PremiumMediaRenderer from './chat/PremiumMediaRenderer.jsx';
import MobileConversationScreen from './chat/MobileConversationScreen.jsx';
import NearbyDiscovery from './chat/NearbyDiscovery.jsx';
import { soundService } from '../services/soundService.js';
import MobileChatLayout from './chat/MobileChatLayout.jsx';
import { API_URL } from '../config/api.js';
import { getWebRTCConfig } from '../config/webrtcConfig.js';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  if (!user) {
    return <div className="loading-screen" style={{ padding: '20px', textAlign: 'center' }}>Loading User Data...</div>;
  }

  const socket = useSocket();
  const connectionStatus = useConnectionStatus();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState(null);
  const [activeCallPeerId, setActiveCallPeerId] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [isLoudspeaker, setIsLoudspeaker] = useState(true);
  const [callError, setCallError] = useState('');
  const [callTimeout, setCallTimeout] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useCrossTabSync('onlineUsers', {});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [lastSeen, setLastSeen] = useState({});
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 769);
  const [isMobileChat, setIsMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [lastMessagePreview, setLastMessagePreview] = useState({});
  const [activeView, setActiveView] = useState('chats');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callActiveRef = useRef(false);
  const socketEventsInitialized = useRef(false);
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const callOverlayRef = useRef(null);
  const setInputRef = useCallback((el) => {
    if (el) inputRef.current = el;
  }, []);

  const createTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current;
    if (el) {
      const scrollTop = el.scrollHeight;
      if (smooth) {
        el.scrollTo({ top: scrollTop, behavior: 'smooth' });
      } else {
        el.scrollTop = scrollTop;
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 769);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Refs to avoid stale closure in cleanupCall
  const localStreamRef = useRef(localStream);
  const remoteStreamRef = useRef(remoteStream);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { remoteStreamRef.current = remoteStream; }, [remoteStream]);

  const cleanupCall = useCallback((reasonOrConfig) => {
    let notifyPeer = false;
    let peerId = null;
    let reason = 'local-ended';

    if (typeof reasonOrConfig === 'string') {
      reason = reasonOrConfig;
    } else if (reasonOrConfig && typeof reasonOrConfig === 'object') {
      notifyPeer = reasonOrConfig.notifyPeer || false;
      peerId = reasonOrConfig.peerId || null;
      reason = reasonOrConfig.reason || 'local-ended';
    }

    if (import.meta.env.DEV) console.log('[WebRTC] cleanupCall triggered', { notifyPeer, peerId, reason });

    if (notifyPeer && peerId && socket) {
      socket.emit('end-call', { to: peerId, from: user.id });
    }

    // Use refs to always access the current stream (avoids stale closure)
    const currentLocalStream = localStreamRef.current;
    const currentRemoteStream = remoteStreamRef.current;

    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (currentRemoteStream) {
      currentRemoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallStatus('idle');
    callActiveRef.current = false;
    setIncomingCall(null);
    setCallType(null);
    setActiveCallPeerId(null);
    pendingCandidatesRef.current = [];

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, [socket, user.id]);

  // Task 1 & 2: Verify and Sync Video Streams
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callActiveRef.current) {
        const targetId = activeCallPeerId || selectedUserRef.current?.id || incomingCall?.from;
        if (targetId && socket) {
          socket.emit('end-call', { to: targetId, from: user.id });
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [socket, user.id, activeCallPeerId, incomingCall]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStream) {
        if (import.meta.env.DEV) console.log('[WebRTC] Syncing local stream to video ref');
        localVideoRef.current.srcObject = localStream;
      }
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        if (import.meta.env.DEV) console.log('[WebRTC] Syncing remote stream to video ref');
        remoteVideoRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, callStatus]);

  const formatLastSeen = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    // Ensure SQLite UTC timestamps are parsed correctly by appending 'Z' if missing
    const dateStr = String(timestamp).includes('T') || String(timestamp).includes('Z') ? timestamp : `${timestamp.replace(' ', 'T')}Z`;
    const date = new Date(dateStr);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (isYesterday) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('zymi_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 769;
      setIsMobileView(mobile);
      if (!mobile) setIsMobileChat(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

const handleSelectUser = (u) => {
    setSelectedUser(u);
    setActiveView('chats'); // Switch back to chats view when a user is selected
    setIsMobileChat(true);
    if (unreadCounts[u.id]) {
      setUnreadCounts(prev => ({ ...prev, [u.id]: 0 }));
      fetch(`${API_URL}/api/messages/read`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: u.id }) }).catch(() => {});
    }
  };

  const handleBack = () => {
    setIsMobileChat(false);
    setSelectedUser(null);
  };

  const handleMessageKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const markAsRead = (senderId) => {
    setUnreadCounts(prev => ({ ...prev, [senderId]: 0 }));
    fetch(`${API_URL}/api/messages/read`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId }) }).catch(() => {});
  };

  useEffect(() => {
    if (!socket || socketEventsInitialized.current) return;
    socketEventsInitialized.current = true;

    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    socket.on('users-list', (userList) => {
      setUsers(userList.filter(u => u.id !== user.id));
    });

    socket.on('new-message', (msg) => {
      if (import.meta.env.DEV) console.log('[Chat] new-message received', msg.id);
      setMessages(prev => {
        // Prevent duplicates
        if (prev.some(m => 
          (m.id && String(m.id) === String(msg.id)) || 
          (m.tempId && m.tempId === msg.tempId) ||
          (m.sender_id === msg.sender_id && m.timestamp === msg.timestamp && m.content === msg.content)
        )) {
          return prev;
        }
        if (String(selectedUser?.id) === String(msg.sender_id) || String(selectedUser?.id) === String(msg.receiver_id)) {
          return [...prev, msg];
        } else {
          setLastMessagePreview(prev => ({ ...prev, [msg.sender_id]: msg.content }));
          return prev;
        }
      });
      if (String(selectedUserRef.current?.id) !== String(msg.sender_id)) {
        setUnreadCounts(prev => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
      }
      
      if (String(msg.sender_id) !== String(user.id)) {
        if (String(selectedUserRef.current?.id) === String(msg.sender_id)) {
          socket.emit('message-read', { messageId: msg.id, senderId: msg.sender_id, receiverId: user.id });
          fetch(`${API_URL}/api/messages/read`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ senderId: msg.sender_id }) }).catch(() => {});
        } else {
          socket.emit('message-delivered', { messageId: msg.id, senderId: msg.sender_id, receiverId: user.id });
        }
      }

      setLastMessagePreview(prev => ({ ...prev, [msg.sender_id]: msg.content }));
      soundService.playMessageSound();
    });

    socket.on('receive_message', (msg) => {
      // Handled by new-message, but adding safety check to avoid duplication
      setMessages(prev => {
        if (prev.some(m => 
          (m.id && String(m.id) === String(msg.id)) || 
          (m.tempId && m.tempId === msg.tempId) ||
          (m.sender_id === msg.sender_id && m.timestamp === msg.timestamp && m.content === msg.content)
        )) {
          return prev;
        }
        if (String(selectedUser?.id) === String(msg.sender_id) || String(selectedUser?.id) === String(msg.receiver_id)) {
          return [...prev, msg];
        }
        return prev;
      });
    });

    socket.on('call-answer', async (data) => {
      if (import.meta.env.DEV) console.log('[WebRTC] call-answer received');
      if (peerConnectionRef.current && data.answer) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus('connected');
          
          if (pendingCandidatesRef.current.length > 0) {
            if (import.meta.env.DEV) console.log(`[WebRTC] Processing ${pendingCandidatesRef.current.length} queued candidates`);
            pendingCandidatesRef.current.forEach(candidate => {
              peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error('[WebRTC] Error adding queued candidate:', err));
            });
            pendingCandidatesRef.current = [];
          }
        } catch (err) {
          console.error('[WebRTC] Error setting remote description:', err);
        }
      }
    });

    socket.on('ice-candidate', async (data) => {
      if (import.meta.env.DEV) console.log('[WebRTC] ice-candidate received');
      if (data.candidate) {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error('[WebRTC] Error adding ice candidate:', err);
          }
        } else {
          if (import.meta.env.DEV) console.log('[WebRTC] Remote description not set, queuing candidate');
          pendingCandidatesRef.current.push(data.candidate);
        }
      }
    });

    socket.on('message-sent', (data) => {
      setMessages(prev => prev.map(m => m.tempId === data.tempId ? { ...m, id: data.id, status: 'sent', pending: false } : m));
    });

    socket.on('message-status-update', (data) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, status: data.status, is_read: data.status === 'read' ? 1 : m.is_read } : m));
    });

    socket.on('message-seen', (data) => {
      setMessages(prev => prev.map(m => m.receiver_id === data.by ? { ...m, status: 'read', is_read: 1 } : m));
    });

    socket.on('user-online', (data) => {
      const userId = String(typeof data === 'object' ? data.userId : data);
      setOnlineUsers(prev => ({ ...prev, [userId]: true }));
    });

    socket.on('user-offline', (data) => {
      const userId = String(typeof data === 'object' ? data.userId : data);
      setOnlineUsers(prev => ({ ...prev, [userId]: false }));
      if (typeof data === 'object' && data.lastSeen) setLastSeen(prev => ({ ...prev, [userId]: data.lastSeen }));
    });

    socket.on('user-typing', ({ from }) => {
      if (import.meta.env.DEV) console.log('[TYPING] user-typing received', { from });
      if (String(from) === String(selectedUserRef.current?.id)) {
        setTypingUsers(prev => ({ ...prev, [String(from)]: true }));
      }
    });

    socket.on('user-stop-typing', ({ from }) => {
      setTypingUsers(prev => ({ ...prev, [String(from)]: false }));
    });

    socket.on('incoming-call', (data) => {
      setIncomingCall(data);
      setCallType(data.type);
      soundService.playCallRingtone();
    });

    socket.on('call-ended', (data) => {
      if (import.meta.env.DEV) console.log('[CALL] call-ended received', data);
      cleanupCall({ reason: 'remote-ended', notifyPeer: false });
    });

    socket.on('call-rejected', (data) => {
      if (import.meta.env.DEV) console.log('[CALL] call-rejected received', data);
      cleanupCall({ reason: 'remote-rejected', notifyPeer: false });
    });

    socket.on('call-error', (data) => {
      setCallError(data.message);
      setTimeout(() => setCallError(''), 5000);
    });

    socket.on('call-timeout', () => {
      setCallTimeout(true);
    });

    socket.on('disconnect', () => {
      if (callActiveRef.current) {
        cleanupCall('socket-disconnect');
      }
    });

    return () => {
      socketEventsInitialized.current = false;
      socket.off('connect');
      socket.off('users-list');
      socket.off('new-message');
      socket.off('receive_message');
      socket.off('message-sent');
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('incoming-call');
      socket.off('call-answer');
      socket.off('ice-candidate');
      socket.off('call-ended');
      socket.off('call-rejected');
      socket.off('call-error');
      socket.off('call-timeout');
      socket.off('message-status-update');
      socket.off('message-seen');
      socket.off('disconnect');
    };
  }, [socket, user.id, selectedUser, scrollToBottom, cleanupCall]);

  useEffect(() => {
    if (!socket) return;
    fetch(`${API_URL}/api/users`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setUsers(data.filter(u => u.id !== user.id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [socket, user.id]);

  useEffect(() => {
    if (!selectedUser || !socket) return;
    setMessagesLoading(true);
    setMessages([]);
    fetch(`${API_URL}/api/messages/${user.id}/${selectedUser.id}`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        // Map is_read to status if already read
        const initializedMessages = data.map(m => ({
          ...m,
          status: m.is_read ? 'read' : m.status || 'sent' // assumes historic messages that are read should display blue ticks
        }));
        setMessages(initializedMessages);
        setMessagesLoading(false);
        setTimeout(() => scrollToBottom(false), 100);
        
        // Mark all as read when opening chat
        const unreadMsgs = initializedMessages.filter(m => m.sender_id === selectedUser.id && !m.is_read);
        if (unreadMsgs.length > 0) {
           unreadMsgs.forEach(m => socket.emit('message-read', { messageId: m.id, senderId: m.sender_id, receiverId: user.id }));
        }
      })
      .catch(() => {
        setMessages([]);
        setMessagesLoading(false);
      });
  }, [selectedUser, socket]);

  const sendMessage = (eventOrText) => {
    if (
      eventOrText &&
      typeof eventOrText === 'object' &&
      typeof eventOrText.preventDefault === 'function'
    ) {
      eventOrText.preventDefault();
    }

    const messageText = typeof eventOrText === 'string' ? eventOrText : newMessage;
    const trimmed = messageText.trim();

    if (!trimmed || !selectedUser || !socket) return;

    const tempId = createTempId();
    const tempMessage = { 
      tempId, 
      sender_id: user.id, 
      receiver_id: selectedUser.id, 
      content: trimmed, 
      message_type: 'text', 
      timestamp: new Date().toISOString(), 
      status: 'pending' 
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.tempId === tempId && m.status === 'pending' ? { ...m, status: 'failed' } : m));
    }, 10000);

    socket.emit('private-message', { to: selectedUser.id, from: user.id, content: trimmed, tempId });
    setLastMessagePreview(prev => ({ ...prev, [selectedUser.id]: trimmed }));
    setNewMessage('');
    socket.emit('stop-typing', { to: selectedUser.id, from: user.id });
    scrollToBottom();
  };

  const retryMessage = (tempId) => {
    const msg = messages.find(m => m.tempId === tempId);
    if (!msg || !socket) return;
    
    if (msg.message_type === 'text' || msg.message_type === 'location') {
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: 'pending' } : m));
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.tempId === tempId && m.status === 'pending' ? { ...m, status: 'failed' } : m));
      }, 10000);
      socket.emit('private-message', { 
        to: msg.receiver_id, 
        from: msg.sender_id, 
        content: msg.content, 
        tempId, 
        message_type: msg.message_type,
        location_lat: msg.location_lat,
        location_lng: msg.location_lng
      });
    } else {
      retryUpload(tempId);
    }
  };

  const handleTyping = () => {
    if (!selectedUser || !socket) return;
    socket.emit('typing', { to: selectedUser.id, from: user.id });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { to: selectedUser.id, from: user.id });
    }, 1000);
  };

  const validateFile = (file) => {
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB
      video: 50 * 1024 * 1024, // 50MB
      document: 25 * 1024 * 1024 // 25MB
    };

    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/ogg'],
      document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };

    let mediaType = 'document'; // default
    if (file.type.startsWith('image/')) mediaType = 'image';
    else if (file.type.startsWith('video/')) mediaType = 'video';

    if (!allowedTypes[mediaType].includes(file.type)) {
      return { valid: false, error: `Unsupported file type. Allowed: ${allowedTypes[mediaType].join(', ')}` };
    }

    if (file.size > maxSizes[mediaType]) {
      const maxSizeMB = maxSizes[mediaType] / (1024 * 1024);
      return { valid: false, error: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} files must be under ${maxSizeMB}MB` };
    }

    return { valid: true, mediaType };
  };

  const uploadFile = (file, tempId) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/api/messages/upload`);
      const token = localStorage.getItem('zymi_token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, uploadProgress: percent } : m));
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch (e) {
            reject(new Error('Invalid response'));
          }
        } else {
          reject(new Error('Upload failed'));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.onabort = () => reject(new Error('Upload cancelled'));
      
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, xhr } : m));
      
      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setCallError(validation.error);
      setTimeout(() => setCallError(''), 5000);
      return;
    }

    const tempId = createTempId();
    let previewUrl = null;
    if (validation.mediaType === 'image' || validation.mediaType === 'video') {
      previewUrl = URL.createObjectURL(file);
    }

    const tempMessage = {
      tempId, sender_id: user.id, receiver_id: selectedUser.id,
      content: `Sending ${file.name}...`, message_type: 'file_uploading',
      timestamp: new Date().toISOString(), status: 'pending',
      file, previewUrl, mediaType: validation.mediaType, uploadProgress: 0
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const data = await uploadFile(file, tempId);
      socket.emit('private-message', {
        to: selectedUser.id, from: user.id, tempId,
        message_type: data.mediaType, file_url: data.url, file_name: data.fileName, file_size: data.fileSize, mime_type: data.mimeType
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    } catch (err) {
      if (err.message !== 'Upload cancelled') {
        setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, content: 'Upload failed', message_type: 'upload_failed', status: 'failed', error: err.message } : m));
      }
    }
  };

  const retryUpload = async (tempId) => {
    const message = messages.find(m => m.tempId === tempId);
    if (!message || !message.file) return;

    setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, content: `Sending ${message.file.name}...`, message_type: 'file_uploading', status: 'pending', error: undefined, uploadProgress: 0 } : m));

    try {
      const data = await uploadFile(message.file, tempId);
      socket.emit('private-message', {
        to: message.receiver_id, from: message.sender_id, tempId,
        message_type: data.mediaType, file_url: data.url, file_name: data.fileName, file_size: data.fileSize, mime_type: data.mimeType
      });
    } catch (err) {
      if (err.message !== 'Upload cancelled') {
        setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, content: 'Upload failed', message_type: 'upload_failed', status: 'failed', error: err.message } : m));
      }
    }
  };

  const removeFailedUpload = (tempId) => {
    setMessages(prev => prev.filter(m => m.tempId !== tempId));
  };

  const shareLocation = () => {
    if (!navigator.geolocation || !selectedUser) return;
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const tempId = createTempId();
      const tempMessage = {
        tempId, sender_id: user.id, receiver_id: selectedUser.id, content: 'Shared Location', message_type: 'location',
        location_lat: latitude, location_lng: longitude, timestamp: new Date().toISOString(), status: 'pending'
      };
      setMessages(prev => [...prev, tempMessage]);
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.tempId === tempId && m.status === 'pending' ? { ...m, status: 'failed' } : m));
      }, 10000);

      socket.emit('private-message', {
        to: selectedUser.id,
        from: user.id,
        tempId,
        message_type: 'location',
        location_lat: latitude,
        location_lng: longitude
      });
    }, (err) => {
      setCallError('Location access denied');
    });
  };

  const handleMessageSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    fetch(`${API_URL}/api/messages/search/${user.id}?q=${encodeURIComponent(query)}`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setSearchResults(data))
      .catch(() => setSearchResults([]));
  };

  const startCall = async (targetUserId, type) => {
    if (callActiveRef.current || !socket) return;
    callActiveRef.current = true;
    setActiveCallPeerId(targetUserId);
    setCallStatus('calling');
    setCallType(type);
    setRemoteStream(null);
    try {
      const config = await getWebRTCConfig();
      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', { to: targetUserId, from: user.id, candidate: e.candidate });
        }
      };

      pc.ontrack = (event) => {
        if (import.meta.env.DEV) console.log('[WebRTC] ontrack received', event.streams.length, 'streams');
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (import.meta.env.DEV) console.log('[WebRTC] ICE state changed:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          cleanupCall({ reason: 'peer-disconnected', notifyPeer: false });
        }
      };

      const stream = type === 'video' ? await navigator.mediaDevices.getUserMedia({ video: true, audio: true }) : await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      if (type === 'video' && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (import.meta.env.DEV) console.log('[WebRTC] call-user emitted', { targetUserId, type });
      socket.emit('call-user', { to: targetUserId, from: user.id, offer, type });
    } catch (err) {
      setCallError('Failed to start call: ' + err.message);
      cleanupCall();
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall || !socket) return;
    setActiveCallPeerId(incomingCall.from);
    setCallStatus('connecting');
    setRemoteStream(null);
    try {
      const config = await getWebRTCConfig();
      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit('ice-candidate', { to: incomingCall.from, from: user.id, candidate: event.candidate });
      };

      pc.ontrack = (event) => {
        if (import.meta.env.DEV) console.log('[WebRTC] ontrack received', event.streams.length, 'streams');
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (import.meta.env.DEV) console.log('[WebRTC] ICE state changed:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
          cleanupCall({ reason: 'peer-disconnected', notifyPeer: false });
        }
      };

      const constraints = incomingCall.type === 'video' ? { video: true, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(incomingCall.offer);
      
      // Process queued candidates
      if (pendingCandidatesRef.current.length > 0) {
        if (import.meta.env.DEV) console.log(`[WebRTC] Processing ${pendingCandidatesRef.current.length} queued candidates`);
        pendingCandidatesRef.current.forEach(candidate => {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(err => console.error('[WebRTC] Error adding queued candidate:', err));
        });
        pendingCandidatesRef.current = [];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (import.meta.env.DEV) console.log('[WebRTC] make-answer emitted');
      socket.emit('make-answer', { to: incomingCall.from, answer });
      setCallStatus('connected');
    } catch (err) {
      setCallError('Failed to accept call');
      cleanupCall();
    }
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (socket && incomingCall) {
      socket.emit('reject-call', { to: incomingCall.from, from: user.id });
    }
    cleanupCall('local-reject');
  };

  const endCall = () => {
    const targetId = activeCallPeerId || selectedUser?.id || (incomingCall?.from);
    cleanupCall({ notifyPeer: true, peerId: targetId });
  };

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => { track.enabled = !micOn; });
      setMicOn(!micOn);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => { track.enabled = !cameraOn; });
      setCameraOn(!cameraOn);
    }
  };

  const toggleSpeaker = () => {
    setIsLoudspeaker(!isLoudspeaker);
  };

  const handleCloseTimeout = () => setCallTimeout(false);

  const handleMobileSendMessage = useCallback((content) => {
    if (!selectedUser || !socket || !content.trim()) return;
    const tempId = createTempId();
    const tempMessage = { tempId, sender_id: user.id, receiver_id: selectedUser.id, content: content.trim(), timestamp: new Date().toISOString(), status: 'pending' };
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.tempId === tempId && m.status === 'pending' ? { ...m, status: 'failed' } : m));
    }, 10000);
    socket.emit('private-message', { to: selectedUser.id, from: user.id, content: content.trim(), tempId });
    socket.emit('stop-typing', { to: selectedUser.id, from: user.id });
  }, [selectedUser, socket, user.id]);

  const renderLastMessagePreview = (lastMsg) => {
    if (!lastMsg) return 'Click to start chatting';
    if (lastMsg.status === 'failed') return 'Failed to send';
    if (lastMsg.status === 'pending' && lastMsg.message_type !== 'file_uploading') return 'Sending...';
    if (lastMsg.message_type === 'image') return '📷 Photo';
    if (lastMsg.message_type === 'video') return '🎬 Video';
    if (lastMsg.message_type === 'document') return `📎 ${lastMsg.file_name || 'Document'}`;
    if (lastMsg.message_type === 'location') return '📍 Location';
    if (lastMsg.message_type === 'file_uploading') return 'Sending...';
    return lastMsg.content.substring(0, 40) + (lastMsg.content.length > 40 ? '...' : '');
  };

  // Unified Premium UI Layout (handles both desktop and mobile internally)
  const filteredUsers = users.filter(u => !userSearchQuery || (u.username || '').toLowerCase().includes(userSearchQuery.toLowerCase()));
  
  return (
    <div className="zymi-premium-app">
      {connectionStatus !== 'connected' && (
        <div className={`connection-banner ${connectionStatus}`}>
          {connectionStatus === 'connecting' && '🔄 Connecting...'}
          {connectionStatus === 'reconnecting' && '🔄 Reconnecting...'}
          {connectionStatus === 'disconnected' && '⚠️ Disconnected'}
          {connectionStatus === 'offline' && '❌ Offline'}
        </div>
      )}

      {user.profile_completion < 100 && (
        <div className="verification-banner" style={{
          background: 'linear-gradient(90deg, #3b82f622, #1e293b88)',
          padding: '10px 20px',
          borderBottom: '1px solid #3b82f633',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          color: '#e2e8f0',
          backdropFilter: 'blur(10px)',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{user.profile_completion}% VERIFIED</span>
            <div style={{ width: '100px', height: '6px', background: '#ffffff11', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${user.profile_completion}%`, height: '100%', background: '#3b82f6' }} />
            </div>
            <span>Complete verification to secure your account.</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!user.email_verified && <span style={{ color: '#fbbf24', fontSize: '11px', background: '#fbbf2411', padding: '2px 8px', borderRadius: '10px', border: '1px solid #fbbf2433' }}>Email Pending</span>}
            {!user.phone_verified && <span style={{ color: '#fbbf24', fontSize: '11px', background: '#fbbf2411', padding: '2px 8px', borderRadius: '10px', border: '1px solid #fbbf2433' }}>Phone Pending</span>}
          </div>
        </div>
      )}

      <PremiumChatShell
        sidebar={
          <PremiumChatSidebar
            users={filteredUsers}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            searchQuery={userSearchQuery}
            onSearchChange={setUserSearchQuery}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            lastMessagePreview={lastMessagePreview}
            unreadCounts={unreadCounts}
            currentUser={user}
            activeView={activeView}
            onLogout={onLogout}
            onViewChange={(view) => {
              setActiveView(view);
              if (view !== 'chats') setSelectedUser(null);
            }}
          />
        }
        header={selectedUser ? (
          <PremiumChatHeader
            selectedUser={selectedUser}
            isOnline={onlineUsers[selectedUser.id]}
            isTyping={typingUsers[selectedUser?.id]}
            onBack={() => isMobileView && setSelectedUser(null)}
            onStartAudioCall={() => startCall(selectedUser.id, 'audio')}
            onStartVideoCall={() => startCall(selectedUser.id, 'video')}
            onMoreActions={() => {/* TODO: Implement more actions */}}
          />
        ) : null}
        messageList={activeView === 'nearby' ? (
          <NearbyDiscovery 
            currentUser={user} 
            onSelectUser={handleSelectUser} 
          />
        ) : selectedUser ? (
          <PremiumMessageList
            messages={messages}
            currentUserId={user.id}
            typingUsers={Object.keys(typingUsers).filter(id => typingUsers[id]).map(id => ({ id, name: users.find(u => u.id === parseInt(id))?.name || 'User' }))}
            messagesEndRef={messagesEndRef}
            onMediaClick={(media) => window.open(`${API_URL}${media.file_url}`, '_blank')}
          />
        ) : (
          <div className="zy-desktop-placeholder">
             <div className="zy-placeholder-icon">💬</div>
             <h3>Select a conversation to start chatting</h3>
          </div>
        )}
        composer={selectedUser && activeView === 'chats' ? (
          <PremiumMessageComposer
            onSendMessage={sendMessage}
            onAttachFile={(files) => handleFileSelect({ target: { files } })}
            onShareLocation={shareLocation}
            onStartRecording={() => {/* TODO: Implement voice recording */}}
            disabled={false}
          />
        ) : null}
        profilePanel={selectedUser && !isMobileView ? (
          <ContactProfilePanel
            selectedUser={selectedUser}
            onlineUsers={onlineUsers}
            lastSeen={lastSeen}
            onBlockUser={() => {/* TODO: Implement block user */}}
            onMuteChat={() => {/* TODO: Implement mute chat */}}
            onViewMedia={() => {/* TODO: Implement view media */}}
            onViewProfile={() => {/* TODO: Implement view profile */}}
          />
        ) : null}
        mobileHome={!selectedUser && isMobileView ? (
          <MobileChatHome
            users={filteredUsers}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            searchQuery={userSearchQuery}
            onSearchChange={setUserSearchQuery}
            onlineUsers={onlineUsers}
            typingUsers={typingUsers}
            lastMessagePreview={lastMessagePreview}
            unreadCounts={unreadCounts}
            currentUser={user}
            onStartNewChat={() => {/* TODO: Implement new chat */}}
          />
        ) : null}
        isMobile={isMobileView}
        selectedUser={selectedUser}
      />

      {incomingCall && (
        <PremiumIncomingCallModal
          incomingCall={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          callType={incomingCall.type}
        />
      )}

      {callError && <div className="call-error-toast" onClick={() => setCallError('')}>{callError}</div>}
      {callTimeout && <CallTimeoutNotice onClose={handleCloseTimeout} />}

      <PremiumCallOverlay
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        callStatus={callStatus}
        callType={callType}
        selectedUser={selectedUser}
        incomingCall={incomingCall}
        isMuted={!micOn}
        isVideoOff={!cameraOn}
        onEndCall={endCall}
        onToggleMute={toggleMic}
        onToggleCamera={toggleCamera}
      />
    </div>
  );
}

export default Dashboard;
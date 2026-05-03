import { useState, useEffect, useCallback } from 'react';
import { SocketProvider } from './socket/SocketContext.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import AdminPanel from './components/admin/AdminPanel.jsx';
import AdminLogin from './components/admin/AdminLogin.jsx';
import { API_URL } from './config/api.js';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('zymi_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('zymi_admin');
    const token = localStorage.getItem('adminToken');
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed && token) {
      parsed.token = token;
    }
    return parsed;
  });

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const path = window.location.pathname;

  const handleLogin = (userData) => {
    localStorage.setItem('zymi_token', userData.token);
    const userInfo = { 
      id: userData.id, 
      username: userData.username, 
      role: userData.role,
      token: userData.token 
    };
    localStorage.setItem('zymi_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const handleLogout = useCallback(() => {
    setIsLoggingOut(true);
    localStorage.removeItem('zymi_user');
    localStorage.removeItem('zymi_token');
    setUser(null);
    setTimeout(() => setIsLoggingOut(false), 100);
  }, []);

  const handleAdminLogin = (adminData) => {
    localStorage.setItem('adminToken', adminData.token);
    localStorage.setItem('zymi_admin', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const handleAdminLogout = useCallback(() => {
    setIsLoggingOut(true);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('zymi_admin');
    setAdmin(null);
    setTimeout(() => setIsLoggingOut(false), 100);
  }, []);

  useEffect(() => {
    const refreshUser = async () => {
      const token = localStorage.getItem('zymi_token');
      if (token && user) {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const fullUser = await res.json();
            const userInfo = { ...fullUser, token };
            localStorage.setItem('zymi_user', JSON.stringify(userInfo));
            setUser(userInfo);
          } else if (res.status === 401 || res.status === 403) {
            handleLogout();
          }
        } catch (err) {
          console.error('Failed to refresh user data:', err);
        }
      }
    };
    refreshUser();
  }, []);

  useEffect(() => {
    if (isLoggingOut && path === '/exclusivesecure' && !admin) {
      window.history.replaceState(null, '', '/exclusivesecure/login');
    }
  }, [isLoggingOut, path, admin]);

  if (path.startsWith('/exclusivesecure')) {
    if (path === '/exclusivesecure/login' || path === '/exclusivesecure/login/') {
      if (admin && !isLoggingOut) {
        return <AdminPanel admin={admin} onLogout={handleAdminLogout} />;
      }
      return <AdminLogin onLogin={handleAdminLogin} />;
    }
    if (!admin || isLoggingOut) {
      return <AdminLogin onLogin={handleAdminLogin} />;
    }
    return <AdminPanel admin={admin} onLogout={handleAdminLogout} />;
  }

  if (!user || isLoggingOut) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <SocketProvider user={user}>
      <Dashboard user={user} onLogout={handleLogout} />
    </SocketProvider>
  );
}

export default App;
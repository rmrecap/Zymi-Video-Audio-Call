import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('zymi_admin_token'));
  const [admin, setAdmin] = useState(() => {
    const stored = sessionStorage.getItem('zymi_admin_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username, password, apiBase) => {
    const res = await fetch(`${apiBase}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error(
        'Backend returned HTML instead of JSON — the server URL may be wrong or the server is asleep. ' +
        'Ensure the SERVER URL points to the Render backend (e.g. https://zymi-server.onrender.com), not the admin portal.'
      );
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error('Invalid response from server (not JSON). Check that the SERVER URL is correct.');
    }

    if (!res.ok) throw new Error(data.error || 'Login failed');
    sessionStorage.setItem('zymi_admin_token', data.token);
    sessionStorage.setItem('zymi_admin_user', JSON.stringify(data.admin));
    sessionStorage.setItem('zymi_api_base', apiBase);
    setToken(data.token);
    setAdmin(data.admin);
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('zymi_admin_token');
    sessionStorage.removeItem('zymi_admin_user');
    sessionStorage.removeItem('zymi_api_base');
    setToken(null);
    setAdmin(null);
  };

  const value = { token, admin, login, logout, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

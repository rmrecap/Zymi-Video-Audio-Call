import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import FeaturesPage from './pages/FeaturesPage';
import SettingsPage from './pages/SettingsPage';
import MonetizationPage from './pages/MonetizationPage';
import NearbyPage from './pages/NearbyPage';
import PresencePage from './pages/PresencePage';
import GatewayPage from './pages/GatewayPage';
import Sidebar from './components/Sidebar';

function ProtectedLayout({ children }) {
  const { isAuthenticated, admin, logout } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen bg-cyber-bg">
      <Sidebar admin={admin} onLogout={logout} />
      <main className="flex-1 overflow-y-auto p-6 ml-64">{children}</main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
      <Route path="/audit" element={<ProtectedLayout><AuditPage /></ProtectedLayout>} />
      <Route path="/features" element={<ProtectedLayout><FeaturesPage /></ProtectedLayout>} />
      <Route path="/monetization" element={<ProtectedLayout><MonetizationPage /></ProtectedLayout>} />
      <Route path="/nearby" element={<ProtectedLayout><NearbyPage /></ProtectedLayout>} />
      <Route path="/presence" element={<ProtectedLayout><PresencePage /></ProtectedLayout>} />
      <Route path="/gateway" element={<ProtectedLayout><GatewayPage /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import React, { useState, useCallback } from 'react';
import { T } from './constants/i18n';
import { useAuthedFetch } from './hooks/useAuthedFetch';
import { C } from './components/ui';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import AttendancePage from './pages/AttendancePage';
import MembersPage from './pages/MembersPage';
import ProfilePage from './pages/ProfilePage';

const stored = () => {
  try {
    return {
      token: localStorage.getItem('token') || null,
      user: JSON.parse(localStorage.getItem('user') || 'null'),
    };
  } catch { return { token: null, user: null }; }
};

export default function App() {
  const init = stored();
  const [token, setToken] = useState(init.token);
  const [user, setUser] = useState(init.user);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'vi');

  const t = T[lang] || T.vi;

  const handleLogin = (newToken, newUser) => {
    setToken(newToken); setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('token'); localStorage.removeItem('user');
  };

  const handleTokenUpdate = useCallback((t) => {
    setToken(t); localStorage.setItem('token', t);
  }, []);

  const handleLangChange = (l) => { setLang(l); localStorage.setItem('lang', l); };

  const authFetch = useAuthedFetch(token, handleTokenUpdate, handleLogout);

  if (!token || !user) {
    return <LoginPage onLogin={handleLogin} lang={lang} setLang={handleLangChange} t={t} />;
  }

  const pageProps = { t, authFetch, user };

  const pages = {
    dashboard:   <DashboardPage {...pageProps} />,
    employees:   <EmployeesPage {...pageProps} />,
    departments: <DepartmentsPage {...pageProps} />,
    attendance:  <AttendancePage {...pageProps} />,
    leaves:      <AttendancePage {...pageProps} />,
    members:     <MembersPage {...pageProps} />,
    profile:     <ProfilePage {...pageProps} />,
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      backgroundColor: C.bg, color: C.text,
    }}>
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        user={user} onLogout={handleLogout}
        lang={lang} setLang={handleLangChange}
        t={t}
      />

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', minWidth: 0 }}>
        <div style={{ maxWidth: '1200px' }}>
          {pages[activeTab] || pages.dashboard}
        </div>
      </main>
    </div>
  );
}

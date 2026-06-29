import React from 'react';
import { C, LangToggle, Avatar } from './ui';

const NAV = [
  { key: 'dashboard',   icon: '▦',  labelKey: 'menuDashboard' },
  { key: 'employees',   icon: '👥', labelKey: 'menuEmployees' },
  { key: 'departments', icon: '🏢', labelKey: 'menuDepartments' },
  { key: 'attendance',  icon: '⏱', labelKey: 'menuAttendance' },
  { key: 'leaves',      icon: '📋', labelKey: 'menuLeaves' },
  { key: 'members',     icon: '💼', labelKey: 'menuMembers', adminOnly: true },
  { key: 'profile',     icon: '👤', labelKey: 'menuProfile' },
];

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, lang, setLang, t }) {
  const roleLabel = { owner: t.roleOwner, admin: t.roleAdmin, employee: t.roleEmployee };

  return (
    <aside style={{
      width: '240px', minWidth: '240px', height: '100vh', position: 'sticky', top: 0,
      backgroundColor: C.dark, display: 'flex', flexDirection: 'column',
      boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: `1px solid ${C.darkBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ color: C.white, fontWeight: '800', fontSize: '16px', letterSpacing: '-0.3px' }}>{t.appName}</div>
            <div style={{ color: C.textLight, fontSize: '10px', marginTop: '1px' }}>Multi-Tenant</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {NAV.filter(item => !item.adminOnly || user.role === 'admin' || user.role === 'owner').map(item => {
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: '10px 14px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500',
                color: active ? C.white : C.textLight,
                backgroundColor: active ? 'rgba(56,189,248,0.12)' : 'transparent',
                borderLeft: active ? `3px solid ${C.brandAccent}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span style={{ fontSize: '16px', width: 20, textAlign: 'center' }}>{item.icon}</span>
              {t[item.labelKey]}
            </button>
          );
        })}
      </nav>

      {/* User box */}
      <div style={{ padding: '16px 12px', borderTop: `1px solid ${C.darkBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Avatar email={user.email} size={36} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ color: C.white, fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            <div style={{ color: C.textLight, fontSize: '11px', marginTop: '2px' }}>{roleLabel[user.role] || user.role}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: '100%', backgroundColor: 'transparent', border: `1px solid ${C.darkBorder}`,
            color: C.textLight, padding: '8px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: '500', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.errorText; e.currentTarget.style.color = C.errorText; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.darkBorder; e.currentTarget.style.color = C.textLight; }}
        >
          {t.btnLogout}
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: `1px solid ${C.darkBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <LangToggle lang={lang} setLang={setLang} />
        <span style={{ fontSize: '10px', color: '#475569' }}>{t.appVersion}</span>
      </div>
    </aside>
  );
}

import React from 'react';

// ─── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  brand: '#2563eb', brandHover: '#1d4ed8', brandLight: '#eff6ff', brandAccent: '#38bdf8',
  dark: '#0f172a', darkMid: '#1e293b', darkBorder: '#334155',
  text: '#0f172a', textMid: '#334155', textMuted: '#64748b', textLight: '#94a3b8',
  bg: '#f8fafc', bgMid: '#f1f5f9', white: '#ffffff',
  border: '#e2e8f0', borderLight: '#f1f5f9',
  success: '#22c55e', successBg: '#dcfce7', successBorder: '#86efac', successText: '#15803d',
  warning: '#eab308', warningBg: '#fef3c7', warningBorder: '#fcd34d', warningText: '#b45309',
  error: '#ef4444', errorBg: '#fee2e2', errorBorder: '#fca5a5', errorText: '#dc2626',
  purple: '#7c3aed', purpleBg: '#ede9fe', purpleText: '#6d28d9',
};

// ─── Language Toggle ──────────────────────────────────────────────────────────
export function LangToggle({ lang, setLang, style = {} }) {
  const base = {
    border: 'none', padding: '5px 14px', borderRadius: '6px',
    cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.15s',
  };
  return (
    <div style={{ display: 'flex', gap: '4px', backgroundColor: C.darkBorder, padding: '3px', borderRadius: '8px', ...style }}>
      {['vi', 'en'].map(l => (
        <button key={l} style={{
          ...base,
          backgroundColor: lang === l ? C.brandAccent : 'transparent',
          color: lang === l ? C.dark : C.textLight,
        }} onClick={() => setLang(l)}>
          {l === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
        </button>
      ))}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export function Alert({ type = 'success', children, onClose }) {
  if (!children) return null;
  const map = {
    success: { bg: C.successBg, border: C.successBorder, color: C.successText, icon: '✓' },
    error:   { bg: C.errorBg,   border: C.errorBorder,   color: C.errorText,   icon: '✕' },
    warning: { bg: C.warningBg, border: C.warningBorder, color: C.warningText, icon: '⚠' },
  };
  const s = map[type] || map.success;
  return (
    <div style={{
      backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.color,
      padding: '12px 16px', borderRadius: '10px', fontSize: '14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: '700', fontSize: '15px' }}>{s.icon}</span>
        {children}
      </span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, fontWeight: '700', fontSize: '16px', lineHeight: 1, padding: '0 2px' }}>×</button>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function RoleBadge({ role, t }) {
  const map = {
    owner:    { bg: C.purpleBg,    color: C.purple },
    admin:    { bg: C.brandLight,  color: C.brand },
    employee: { bg: C.successBg,   color: C.successText },
  };
  const s = map[role] || { bg: C.bgMid, color: C.textMuted };
  const labels = { owner: t.roleOwner, admin: t.roleAdmin, employee: t.roleEmployee };
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {labels[role] || role}
    </span>
  );
}

export function StatusBadge({ status, t }) {
  const map = {
    active:     { bg: C.successBg, color: C.successText },
    on_leave:   { bg: C.warningBg, color: C.warningText },
    terminated: { bg: C.errorBg,   color: C.errorText },
  };
  const s = map[status] || { bg: C.bgMid, color: C.textMuted };
  const labels = { active: t.statusActive, on_leave: t.statusOnLeave, terminated: t.statusTerminated };
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {labels[status] || status}
    </span>
  );
}

export function LeaveBadge({ status, t }) {
  const map = {
    pending:  { bg: C.warningBg, color: C.warningText },
    approved: { bg: C.successBg, color: C.successText },
    rejected: { bg: C.errorBg,   color: C.errorText },
  };
  const s = map[status] || { bg: C.bgMid, color: C.textMuted };
  const labels = { pending: t.leaveStatusPending, approved: t.leaveStatusApproved, rejected: t.leaveStatusRejected };
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
      {labels[status] || status}
    </span>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
export function Btn({ variant = 'primary', size = 'md', disabled, onClick, children, type = 'button', style = {} }) {
  const sizes = { sm: '6px 14px', md: '9px 20px', lg: '12px 28px' };
  const base = {
    border: 'none', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '600', fontSize: '14px', transition: 'all 0.15s',
    padding: sizes[size], display: 'inline-flex', alignItems: 'center', gap: '6px',
    opacity: disabled ? 0.6 : 1,
  };
  const variants = {
    primary:   { backgroundColor: C.brand,     color: C.white },
    secondary: { backgroundColor: C.bgMid,     color: C.textMid, border: `1px solid ${C.border}` },
    danger:    { backgroundColor: C.errorBg,   color: C.errorText },
    ghost:     { backgroundColor: 'transparent', color: C.textMuted, border: `1px solid ${C.darkBorder}` },
    success:   { backgroundColor: C.successBg, color: C.successText },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

// ─── Form inputs ──────────────────────────────────────────────────────────────
export const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: `1.5px solid ${C.border}`, backgroundColor: C.white,
  color: C.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
export const labelStyle = {
  display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: C.textMid,
};

export function FormField({ label, children }) {
  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, subtitle, onClose, children, maxWidth = '500px' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: C.white, borderRadius: '20px', padding: '36px',
        width: '100%', maxWidth, boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {title && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: 0, color: C.text, fontSize: '18px', fontWeight: '700' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0 0', color: C.textMuted, fontSize: '13px' }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
export function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', loading }) {
  return (
    <Modal title={title} maxWidth='400px'>
      <p style={{ color: C.textMuted, marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Btn variant='secondary' onClick={onCancel}>Cancel</Btn>
        <Btn variant='danger' disabled={loading} onClick={onConfirm}>{loading ? '…' : confirmLabel}</Btn>
      </div>
    </Modal>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      backgroundColor: C.white, borderRadius: '16px', padding: '28px 30px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      borderTop: accent ? `3px solid ${accent}` : undefined,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <Card style={{ padding: '24px 30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: 0, color: C.text, fontSize: '18px', fontWeight: '700' }}>{title}</h3>
          {subtitle && <p style={{ color: C.textMuted, fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
    </Card>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, empty }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: C.bg }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '12px 16px', color: C.textMuted, fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: `2px solid ${C.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function TR({ children, onClick }) {
  return (
    <tr onClick={onClick} style={{ borderBottom: `1px solid ${C.borderLight}`, transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
      {children}
    </tr>
  );
}

export function TD({ children, style = {} }) {
  return <td style={{ padding: '13px 16px', color: C.textMid, fontSize: '14px', ...style }}>{children}</td>;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', message }) {
  return (
    <div style={{ border: `2px dashed ${C.border}`, borderRadius: '12px', padding: '48px', textAlign: 'center', color: C.textLight }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '14px', fontWeight: '500' }}>{message}</div>
    </div>
  );
}

// ─── Spinner / Loading ────────────────────────────────────────────────────────
export function Loading({ text = 'Loading…' }) {
  return (
    <div style={{ textAlign: 'center', color: C.textLight, padding: '60px', fontSize: '14px' }}>
      <div style={{ fontSize: '24px', marginBottom: '12px', animation: 'spin 1s linear infinite' }}>⟳</div>
      {text}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ email, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, minWidth: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.white, fontWeight: '700', fontSize: size * 0.38,
    }}>
      {(email || 'U')[0].toUpperCase()}
    </div>
  );
}

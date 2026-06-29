import React, { useState } from 'react';
import { C, Card, PageHeader, Btn, Alert, Avatar, RoleBadge, FormField, inputStyle } from '../components/ui';

export default function ProfilePage({ t, authFetch, user }) {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  const handleChangePwd = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 8) { setError(t.pwdMin8); return; }
    if (form.new_password !== form.confirm_password) { setError(t.pwdMismatch); return; }
    setSaving(true); setError('');
    try {
      const res = await authFetch('/api/v1/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      if (!res.ok) throw new Error();
      setSuccess(t.changePwdSuccess);
      setForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch { setError(t.errSave); }
    finally { setSaving(false); }
  };

  const inp = (field) => (
    <input type='password' value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      required style={inputStyle}
      onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.brandLight}`; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
      <PageHeader title={t.profileTitle} subtitle={t.profileSubtitle} />

      {success && <Alert type='success' onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert type='error' onClose={() => setError('')}>{error}</Alert>}

      {/* Profile info card */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
          <Avatar email={user.email} size={64} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: C.text }}>{user.email}</div>
            <div style={{ marginTop: '8px' }}><RoleBadge role={user.role} t={t} /></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: t.profileEmail,  value: user.email },
            { label: t.profileRole,   value: <RoleBadge role={user.role} t={t} /> },
            { label: t.profileStatus, value: (
              <span style={{ backgroundColor: C.successBg, color: C.successText, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                {t.profileStatusActive}
              </span>
            )},
            { label: t.profileTenant, value: user.tenant_id || user.subdomain || '—' },
          ].map(row => (
            <div key={row.label} style={{ backgroundColor: C.bg, borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{row.label}</div>
              <div style={{ fontSize: '14px', color: C.textMid, fontWeight: '500' }}>{row.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Change password card */}
      <Card accent={C.brand}>
        <h4 style={{ margin: '0 0 4px 0', color: C.text, fontSize: '16px', fontWeight: '700' }}>{t.changePwdTitle}</h4>
        <p style={{ color: C.textMuted, fontSize: '13px', marginBottom: '24px', marginTop: '4px' }}>{t.changePwdSubtitle}</p>

        <form onSubmit={handleChangePwd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormField label={t.labelCurrentPwd}>{inp('current_password')}</FormField>
          <FormField label={t.labelNewPwd}>{inp('new_password')}</FormField>
          <FormField label={t.labelConfirmPwd}>{inp('confirm_password')}</FormField>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Btn type='submit' disabled={saving}>{saving ? '…' : `🔒 ${t.btnChangePwd}`}</Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}

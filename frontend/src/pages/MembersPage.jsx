import React, { useState, useEffect } from 'react';
import { C, Card, PageHeader, Table, TR, TD, Btn, Alert, Modal, FormField, EmptyState, Loading, RoleBadge, Avatar, inputStyle, ConfirmDialog } from '../components/ui';

export default function MembersPage({ t, authFetch, user }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'employee' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await authFetch('/api/v1/tenants/members');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMembers(data.members || data || []);
    } catch { setError(t.errFetch); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await authFetch('/api/v1/tenants/members/invite', { method: 'POST', body: JSON.stringify(inviteForm) });
      if (!res.ok) throw new Error();
      setSuccess(t.memberInviteSuccess); setShowInvite(false); load();
    } catch { setError(t.errSave); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/tenants/members/${removeTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setSuccess(t.memberRemoveSuccess); setRemoveTarget(null); load();
    } catch { setError(t.errDelete); }
    finally { setSaving(false); }
  };

  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await authFetch(`/api/v1/tenants/members/${memberId}/role`, { method: 'PUT', body: JSON.stringify({ role: newRole }) });
      if (!res.ok) throw new Error();
      setSuccess(t.memberRoleUpdated); load();
    } catch { setError(t.errSave); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader title={t.membersTitle} subtitle={t.membersSubtitle}
        action={<Btn onClick={() => setShowInvite(true)}>＋ {t.memberInvite}</Btn>} />

      {success && <Alert type='success' onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert type='error' onClose={() => setError('')}>{error}</Alert>}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Loading /> : members.length === 0 ? (
          <div style={{ padding: '32px' }}><EmptyState icon='💼' message={t.noMembers} /></div>
        ) : (
          <Table headers={['Member', 'Role', t.thActions]}>
            {members.map(m => (
              <TR key={m.id}>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar email={m.email} size={36} />
                    <div>
                      <div style={{ fontWeight: '600', color: C.text, fontSize: '14px' }}>
                        {m.email}
                        {m.email === user.email && <span style={{ color: C.textLight, fontWeight: '400', marginLeft: '6px', fontSize: '12px' }}>{t.memberYou}</span>}
                      </div>
                      {m.name && <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '1px' }}>{m.name}</div>}
                    </div>
                  </div>
                </TD>
                <TD>
                  {m.email === user.email || m.role === 'owner' ? (
                    <RoleBadge role={m.role} t={t} />
                  ) : (
                    <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                      style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${C.border}`, fontSize: '12px', fontWeight: '600', cursor: 'pointer', outline: 'none', backgroundColor: C.bgMid, color: C.textMid }}>
                      <option value='admin'>{t.roleAdmin}</option>
                      <option value='employee'>{t.roleEmployee}</option>
                    </select>
                  )}
                </TD>
                <TD>
                  {m.email !== user.email && m.role !== 'owner' && (
                    <Btn variant='danger' size='sm' onClick={() => setRemoveTarget(m)}>{t.memberRemove}</Btn>
                  )}
                </TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {showInvite && (
        <Modal title={t.memberInviteTitle} onClose={() => setShowInvite(false)} maxWidth='420px'>
          <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField label={t.labelEmail}>
              <input type='email' required value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                placeholder='colleague@company.com' style={inputStyle}
                onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.brandLight}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
            </FormField>
            <FormField label='Role'>
              <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.brandLight}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
                <option value='admin'>{t.roleAdmin}</option>
                <option value='employee'>{t.roleEmployee}</option>
              </select>
            </FormField>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Btn variant='secondary' onClick={() => setShowInvite(false)}>{t.empCancel}</Btn>
              <Btn type='submit' disabled={saving}>{saving ? '…' : `📧 ${t.memberInvite}`}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {removeTarget && (
        <ConfirmDialog
          title={t.memberRemove}
          message={t.memberConfirmRemove}
          confirmLabel={t.memberRemove}
          loading={saving}
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}

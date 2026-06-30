import React, { useState, useEffect } from 'react';
import { C, Card, PageHeader, Table, TR, TD, Btn, Alert, Modal, FormField, EmptyState, Loading, ConfirmDialog, inputStyle } from '../components/ui';

export default function DepartmentsPage({ t, authFetch, user }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const isAdmin = user.role === 'admin' || user.role === 'owner';

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await authFetch('/api/v1/hr/departments');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDepartments(data.departments || data || []);
    } catch { setError(t.errFetch); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); };
  const openEdit = (dept) => { setEditing(dept); setForm({ name: dept.name || '', description: dept.description || '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/v1/hr/departments/${editing.id}` : '/api/v1/hr/departments';
      const res = await authFetch(url, { method, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      setSuccess(editing ? t.deptEditSuccess : t.deptAddSuccess);
      setShowModal(false); load();
    } catch { setError(t.errSave); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/hr/departments/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setSuccess(t.deptDeleteSuccess); setDeleteTarget(null); load();
    } catch { setError(t.errDelete); }
    finally { setSaving(false); }
  };

  const inp = (field, type = 'text', opts = {}) => (
    <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      required={opts.required} style={inputStyle}
      onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.brandLight}`; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader title={t.deptTitle} subtitle={t.deptSubtitle}
        action={isAdmin && <Btn onClick={openAdd}>＋ {t.deptAdd}</Btn>} />

      {success && <Alert type='success' onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert type='error' onClose={() => setError('')}>{error}</Alert>}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Loading text={t.deptLoading} /> : departments.length === 0 ? (
          <div style={{ padding: '32px' }}><EmptyState icon='🏢' message={t.deptEmpty} /></div>
        ) : (
          <Table headers={[t.labelDeptName, t.labelDeptDesc, t.thEmpCount, ...(isAdmin ? [t.thActions] : [])]}>
            {departments.map(dept => (
              <TR key={dept.id}>
                <TD>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb20, #38bdf830)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🏢</div>
                    <span style={{ fontWeight: '600', color: C.text }}>{dept.name}</span>
                  </div>
                </TD>
                <TD style={{ color: C.textMuted }}>{dept.description || '—'}</TD>
                <TD>
                  <span style={{ backgroundColor: C.bgMid, color: C.textMuted, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                    {dept.employee_count ?? 0} {t.thEmpCount}
                  </span>
                </TD>
                {isAdmin && (
                  <TD>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Btn variant='secondary' size='sm' onClick={() => openEdit(dept)}>{t.btnEdit}</Btn>
                      <Btn variant='danger' size='sm' onClick={() => setDeleteTarget(dept)}>{t.deptDelete}</Btn>
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {showModal && (
        <Modal title={editing ? t.deptEdit : t.deptAdd} onClose={() => setShowModal(false)} maxWidth='460px'>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField label={t.labelDeptName}>{inp('name', 'text', { required: true })}</FormField>
            <FormField label={t.labelDeptDesc}>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.brandLight}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
            </FormField>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Btn variant='secondary' onClick={() => setShowModal(false)}>{t.empCancel}</Btn>
              <Btn type='submit' disabled={saving}>{saving ? '…' : t.empSave}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={t.deptConfirmDelete}
          message={`${t.deptConfirmDeleteMsg} "${deleteTarget.name}"?`}
          confirmLabel={t.deptDelete}
          loading={saving}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

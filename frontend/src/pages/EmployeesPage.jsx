import React, { useState, useEffect } from 'react';
import { C, Card, PageHeader, Table, TR, TD, Btn, Alert, Modal, FormField, EmptyState, Loading, StatusBadge, inputStyle, labelStyle, ConfirmDialog } from '../components/ui';

export default function EmployeesPage({ t, authFetch, user }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', position: '', department_id: '', joined_date: '', status: 'active' });

  const isAdmin = user.role === 'admin' || user.role === 'owner';

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [empRes, deptRes] = await Promise.all([
        authFetch('/api/v1/hr/employees'),
        authFetch('/api/v1/hr/departments'),
      ]);
      if (!empRes.ok) throw new Error();
      const empData = await empRes.json();
      setEmployees(empData.employees || empData || []);
      if (deptRes.ok) { const d = await deptRes.json(); setDepartments(d.departments || d || []); }
    } catch { setError(t.errFetch); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ first_name: '', last_name: '', email: '', position: '', department_id: '', joined_date: '', status: 'active' }); setShowModal(true); };
  const openEdit = (emp) => { setEditing(emp); setForm({ first_name: emp.first_name || '', last_name: emp.last_name || '', email: emp.email || '', position: emp.position || '', department_id: emp.department_id || '', joined_date: emp.joined_date ? emp.joined_date.slice(0, 10) : '', status: emp.status || 'active' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/v1/hr/employees/${editing.id}` : '/api/v1/hr/employees';
      const payload = { ...form, joined_date: form.joined_date || null, department_id: form.department_id || null };
      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      setSuccess(editing ? t.empEditSuccess : t.empAddSuccess);
      setShowModal(false); load();
    } catch { setError(t.errSave); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`/api/v1/hr/employees/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setSuccess(t.empDeleteSuccess); setDeleteTarget(null); load();
    } catch { setError(t.errDelete); }
    finally { setSaving(false); }
  };

  const deptName = (id) => departments.find(d => d.id === id)?.name || t.noDepartment;
  const inp = (field, type = 'text', opts) => (
    <input type={type} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
      style={inputStyle} required={opts?.required}
      onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.brandLight}`; }}
      onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader title={t.empTitle} subtitle={t.empSubtitle}
        action={isAdmin && <Btn onClick={openAdd}>＋ {t.empAdd}</Btn>} />

      {success && <Alert type='success' onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert type='error' onClose={() => setError('')}>{error}</Alert>}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? <Loading text={t.empLoading} /> : employees.length === 0 ? (
          <div style={{ padding: '32px' }}><EmptyState icon='👥' message={t.empEmpty} /></div>
        ) : (
          <Table headers={[t.thName, t.thPosition, t.thEmail, t.thDepartment, t.thJoinDate, t.thStatus, ...(isAdmin ? [t.thActions] : [])]}>
            {employees.map(emp => (
              <TR key={emp.id}>
                <TD style={{ fontWeight: '600', color: C.text }}>{emp.first_name} {emp.last_name}</TD>
                <TD>{emp.position || '—'}</TD>
                <TD style={{ color: C.textMuted }}>{emp.email}</TD>
                <TD>{deptName(emp.department_id)}</TD>
                <TD style={{ color: C.textMuted }}>{emp.joined_date ? emp.joined_date.slice(0, 10) : '—'}</TD>
                <TD><StatusBadge status={emp.status} t={t} /></TD>
                {isAdmin && (
                  <TD>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Btn variant='secondary' size='sm' onClick={() => openEdit(emp)}>{t.btnEdit}</Btn>
                      <Btn variant='danger' size='sm' onClick={() => setDeleteTarget(emp)}>{t.empDelete}</Btn>
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal title={editing ? t.empEdit : t.empAdd} onClose={() => setShowModal(false)} maxWidth='540px'>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label={t.labelFirstName}>{inp('first_name', 'text', { required: true })}</FormField>
              <FormField label={t.labelLastName}>{inp('last_name', 'text', { required: true })}</FormField>
            </div>
            <FormField label={t.thEmail}>{inp('email', 'email', { required: true })}</FormField>
            <FormField label={t.labelPosition}>{inp('position')}</FormField>
            <FormField label={t.labelDepartment}>
              <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                style={{ ...inputStyle }}
                onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.brandLight}`; }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
                <option value=''>{t.noDepartment}</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label={t.labelJoinDate}>{inp('joined_date', 'date')}</FormField>
              <FormField label={t.labelStatus}>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ ...inputStyle }}
                  onFocus={e => { e.target.style.borderColor = C.brand; e.target.style.boxShadow = `0 0 0 3px ${C.brandLight}`; }}
                  onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
                  <option value='active'>{t.statusActive}</option>
                  <option value='on_leave'>{t.statusOnLeave}</option>
                  <option value='terminated'>{t.statusTerminated}</option>
                </select>
              </FormField>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Btn variant='secondary' onClick={() => setShowModal(false)}>{t.empCancel}</Btn>
              <Btn type='submit' disabled={saving}>{saving ? '…' : t.empSave}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          title={t.empConfirmDelete}
          message={`${t.empConfirmDeleteMsg} ${deleteTarget.first_name} ${deleteTarget.last_name}?`}
          confirmLabel={t.empDelete}
          loading={saving}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

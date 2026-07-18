import React, { useState, useEffect } from 'react';
import { C, Card, PageHeader, Table, TR, TD, Btn, Alert, EmptyState, Loading } from '../components/ui';

export default function LeavesPage({ t, authFetch, user }) {
  const [myLeaves, setMyLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [myEmployee, setMyEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', leave_type: 'sick', reason: '' });
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const isAdmin = user.role === 'admin' || user.role === 'owner';

  const load = async () => {
    setLoading(true);
    try {
      const [empsRes, leavesRes] = await Promise.all([
        authFetch('/api/v1/hr/employees'),
        authFetch('/api/v1/hr/leaves/my-leaves'),
      ]);
      if (empsRes.ok) {
        const emps = await empsRes.json();
        const arr = Array.isArray(emps) ? emps : [];
        setMyEmployee(arr.find(e => e.email === user.email) || null);
      }
      if (leavesRes.ok) {
        const d = await leavesRes.json().catch(() => null);
        if (Array.isArray(d)) setMyLeaves(d);
      }
      if (isAdmin) {
        const pendRes = await authFetch('/api/v1/hr/leaves/pending');
        if (pendRes.ok) {
          const d = await pendRes.json().catch(() => null);
          if (Array.isArray(d)) setPendingLeaves(d);
        }
      }
    } catch { setError(t.errFetch); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!myEmployee) { setError(t.attNoProfile); return; }
    setActionLoading(true);
    try {
      const res = await authFetch('/api/v1/hr/leaves', {
        method: 'POST',
        body: JSON.stringify({ ...leaveForm, employee_id: myEmployee.id }),
      });
      if (!res.ok) throw new Error();
      setSuccess(t.leaveSubmitSuccess);
      setShowLeaveForm(false);
      setLeaveForm({ start_date: '', end_date: '', leave_type: 'annual', reason: '' });
      load();
    } catch { setError(t.errSave); }
    finally { setActionLoading(false); }
  };

  const handleLeaveAction = async (id, action) => {
    setActionLoading(true);
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const res = await authFetch(`/api/v1/hr/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setSuccess(action === 'approve' ? t.leaveApprovedSuccess : t.leaveRejectedSuccess);
      load();
    } catch { setError(t.errConn); }
    finally { setActionLoading(false); }
  };

  const inpS = {
    width: '100%', padding: '9px 14px', borderRadius: '8px',
    border: `1.5px solid ${C.border}`, backgroundColor: C.white, color: C.text, fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  };

  if (loading) return <Loading text={t.attLoading} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader title={t.leavesTitle} subtitle={t.leavesSubtitle} />

      {success && <Alert type='success' onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert type='error' onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: C.text, fontWeight: '700', fontSize: '15px' }}>{t.leaveFormTitle}</h4>
          <Btn variant={showLeaveForm ? 'secondary' : 'primary'} onClick={() => setShowLeaveForm(v => !v)}>
            {showLeaveForm ? '✕ Cancel' : `＋ ${t.leaveNewBtn}`}
          </Btn>
        </div>
        {showLeaveForm && (
          <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: C.textMid }}>{t.labelStartDate}</label>
                <input type='date' required value={leaveForm.start_date}
                  onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))} style={inpS} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: C.textMid }}>{t.labelEndDate}</label>
                <input type='date' required value={leaveForm.end_date}
                  onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))} style={inpS} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: C.textMid }}>{t.labelLeaveType}</label>
              <select value={leaveForm.leave_type} onChange={e => setLeaveForm(f => ({ ...f, leave_type: e.target.value }))} style={inpS}>
                <option value='sick'>{t.leaveTypeSick}</option>
                <option value='vacation'>{t.leaveTypeAnnual}</option>
                <option value='unpaid'>{t.leaveTypePersonal}</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: C.textMid }}>{t.labelReason}</label>
              <textarea value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} rows={3}
                style={{ ...inpS, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn type='submit' disabled={actionLoading || !myEmployee}>
                {actionLoading ? '…' : `📤 ${t.leaveNewBtn}`}
              </Btn>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <h4 style={{ margin: '0 0 16px 0', color: C.text, fontSize: '15px', fontWeight: '700' }}>{t.myLeavesTitle}</h4>
        {myLeaves.length === 0 ? <EmptyState icon='📋' message={t.noLeaves} /> : (
          <Table headers={[t.labelLeaveType, t.leavePeriod, 'Status']}>
            {myLeaves.map((l, i) => {
              const clr = { pending: C.warningText, approved: C.successText, rejected: C.errorText };
              const bg  = { pending: C.warningBg,   approved: C.successBg,   rejected: C.errorBg   };
              return (
                <TR key={i}>
                  <TD style={{ fontWeight: '500' }}>{l.leave_type}</TD>
                  <TD style={{ color: C.textMuted }}>{l.start_date?.slice(0, 10)} → {l.end_date?.slice(0, 10)}</TD>
                  <TD>
                    <span style={{ backgroundColor: bg[l.status], color: clr[l.status], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                      {l.status}
                    </span>
                  </TD>
                </TR>
              );
            })}
          </Table>
        )}
      </Card>

      {isAdmin && (
        <Card>
          <h4 style={{ margin: '0 0 16px 0', color: C.text, fontSize: '15px', fontWeight: '700' }}>{t.pendingLeavesTitle}</h4>
          {pendingLeaves.length === 0 ? <EmptyState icon='✓' message={t.noPendingLeaves} /> : (
            <Table headers={['Employee', t.labelLeaveType, t.leavePeriod, t.thActions]}>
              {pendingLeaves.map((l, i) => (
                <TR key={i}>
                  <TD style={{ fontWeight: '500' }}>{l.employee_name || l.employee_id}</TD>
                  <TD>{l.leave_type}</TD>
                  <TD style={{ color: C.textMuted }}>{l.start_date?.slice(0, 10)} → {l.end_date?.slice(0, 10)}</TD>
                  <TD>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Btn variant='success' size='sm' disabled={actionLoading} onClick={() => handleLeaveAction(l.id, 'approve')}>{t.btnApprove}</Btn>
                      <Btn variant='danger' size='sm' disabled={actionLoading} onClick={() => handleLeaveAction(l.id, 'reject')}>{t.btnReject}</Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}

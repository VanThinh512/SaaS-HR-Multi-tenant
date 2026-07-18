import React, { useState, useEffect } from 'react';
import { C, Card, PageHeader, Table, TR, TD, Btn, Alert, EmptyState, Loading } from '../components/ui';

function formatDuration(inStr, outStr) {
  if (!inStr || !outStr) return '—';
  const diff = new Date(outStr) - new Date(inStr);
  if (diff <= 0) return '—';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function formatTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString();
}

export default function AttendancePage({ t, authFetch, user }) {
  const [myLogs, setMyLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user.role === 'admin' || user.role === 'owner';

  const load = async () => {
    setLoading(true);
    try {
      const [empsRes, myLogsRes] = await Promise.all([
        authFetch('/api/v1/hr/employees'),
        authFetch('/api/v1/hr/attendance/my-logs'),
      ]);
      if (empsRes.ok) {
        const emps = await empsRes.json();
        const arr = Array.isArray(emps) ? emps : [];
        setMyProfile(arr.find(e => e.email === user.email) || null);
      }
      if (myLogsRes.ok) {
        const logs = await myLogsRes.json().catch(() => null);
        if (Array.isArray(logs)) {
          setMyLogs(logs);
          const todayStr = new Date().toLocaleDateString();
          setToday(logs.find(l => new Date(l.check_in).toLocaleDateString() === todayStr) || null);
        }
      }
      if (isAdmin) {
        const allRes = await authFetch('/api/v1/hr/attendance/all-logs');
        if (allRes.ok) {
          const d = await allRes.json().catch(() => null);
          if (Array.isArray(d)) setAllLogs(d);
        }
      }
    } catch { setError(t.errFetch); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleClockIn = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch('/api/v1/hr/attendance/check-in', { method: 'POST' });
      if (!res.ok) throw new Error();
      setSuccess(t.attClockInSuccess); load();
    } catch { setError(t.errConn); }
    finally { setActionLoading(false); }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
      const res = await authFetch('/api/v1/hr/attendance/check-out', { method: 'POST' });
      if (!res.ok) throw new Error();
      setSuccess(t.attClockOutSuccess); load();
    } catch { setError(t.errConn); }
    finally { setActionLoading(false); }
  };

  if (loading) return <Loading text={t.attLoading} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader title={t.attTitle} subtitle={t.attSubtitle} />

      {success && <Alert type='success' onClose={() => setSuccess('')}>{success}</Alert>}
      {error && <Alert type='error' onClose={() => setError('')}>{error}</Alert>}

      {myProfile ? (
        <Card accent={today ? C.success : C.border}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>
                {today ? `${t.attCheckedIn} ${formatTime(today.check_in)}` : t.attNotClockedIn}
              </div>
              {today?.check_out && (
                <div style={{ fontSize: '13px', color: C.textMuted }}>
                  {t.thCheckOut}: {formatTime(today.check_out)} · {t.thDuration}: {formatDuration(today.check_in, today.check_out)}
                </div>
              )}
            </div>
            <div>
              {!today ? (
                <Btn disabled={actionLoading} onClick={handleClockIn}>⏱ {t.btnClockIn}</Btn>
              ) : !today.check_out ? (
                <Btn variant='secondary' disabled={actionLoading} onClick={handleClockOut}>⏹ {t.btnClockOut}</Btn>
              ) : (
                <span style={{ color: C.successText, fontWeight: '600', fontSize: '14px' }}>✓ Done for today</span>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Alert type='warning'>{t.attNoProfile}</Alert>
      )}

      <Card>
        <h4 style={{ margin: '0 0 16px 0', color: C.text, fontSize: '15px', fontWeight: '700' }}>{t.attMyLogs}</h4>
        {myLogs.length === 0 ? <EmptyState icon='⏱' message={t.attNoLogs} /> : (
          <Table headers={['Date', t.thCheckIn, t.thCheckOut, t.thDuration]}>
            {myLogs.slice(0, 20).map((log, i) => (
              <TR key={i}>
                <TD style={{ fontWeight: '500' }}>{formatDate(log.check_in)}</TD>
                <TD>{formatTime(log.check_in)}</TD>
                <TD>{formatTime(log.check_out)}</TD>
                <TD style={{ color: C.textMuted }}>{formatDuration(log.check_in, log.check_out)}</TD>
              </TR>
            ))}
          </Table>
        )}
      </Card>

      {isAdmin && (
        <Card>
          <h4 style={{ margin: '0 0 16px 0', color: C.text, fontSize: '15px', fontWeight: '700' }}>{t.attAllLogs}</h4>
          {allLogs.length === 0 ? <EmptyState icon='📋' message={t.attNoLogs} /> : (
            <Table headers={['Employee', 'Date', t.thCheckIn, t.thCheckOut, t.thDuration]}>
              {allLogs.slice(0, 30).map((log, i) => (
                <TR key={i}>
                  <TD style={{ fontWeight: '500' }}>{log.employee_name || log.employee_id}</TD>
                  <TD style={{ color: C.textMuted }}>{formatDate(log.check_in)}</TD>
                  <TD>{formatTime(log.check_in)}</TD>
                  <TD>{formatTime(log.check_out)}</TD>
                  <TD style={{ color: C.textMuted }}>{formatDuration(log.check_in, log.check_out)}</TD>
                </TR>
              ))}
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}

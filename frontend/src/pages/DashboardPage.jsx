import React, { useState, useEffect, useCallback } from 'react';
import { C, Card, Alert, Table, TR, TD, Btn } from '../components/ui';

const SERVICES = [
  { key: 'auth',   label: 'Auth Service',   icon: '🔐', port: 8000, url: '/api/v1/auth/health' },
  { key: 'tenant', label: 'Tenant Service', icon: '🏢', port: 8001, url: '/api/v1/tenants/health' },
  { key: 'hr',     label: 'HR Service',     icon: '👥', port: 8002, url: '/api/v1/hr/health' },
];

function StatCard({ icon, label, value, color = C.brand, bg = C.brandLight, note }) {
  return (
    <div style={{
      backgroundColor: C.white, borderRadius: '16px', padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      borderTop: `4px solid ${color}`, display: 'flex', flexDirection: 'column', gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '12px', backgroundColor: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
        }}>{icon}</div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: C.textMuted }}>{label}</div>
      </div>
      <div style={{ fontSize: '32px', fontWeight: '800', color: C.text, lineHeight: 1 }}>{value ?? '—'}</div>
      {note && <div style={{ fontSize: '12px', color: C.textMuted }}>{note}</div>}
    </div>
  );
}

export default function DashboardPage({ t, user, authFetch }) {
  const [statuses, setStatuses] = useState({});
  const [traceId] = useState(() => crypto.randomUUID().slice(0, 8).toUpperCase());
  const [stats, setStats] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [empMap, setEmpMap] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const isAdmin = user.role === 'admin' || user.role === 'owner';

  // Service health
  useEffect(() => {
    SERVICES.forEach(svc => {
      authFetch(svc.url)
        .then(r => setStatuses(s => ({ ...s, [svc.key]: r.ok ? 'up' : 'down' })))
        .catch(() => setStatuses(s => ({ ...s, [svc.key]: 'down' })));
    });
  }, [authFetch]);

  // HR stats
  const loadStats = useCallback(async () => {
    try {
      const reqs = [
        authFetch('/api/v1/hr/employees'),
        authFetch('/api/v1/hr/departments'),
        authFetch(isAdmin ? '/api/v1/hr/leaves/pending' : '/api/v1/hr/leaves/my-leaves'),
      ];
      const [empsRes, deptsRes, leavesRes] = await Promise.all(reqs);

      const emps   = empsRes.ok   ? await empsRes.json().catch(() => [])   : [];
      const depts  = deptsRes.ok  ? await deptsRes.json().catch(() => [])  : [];
      const leaves = leavesRes.ok ? await leavesRes.json().catch(() => []) : [];

      const empArr   = Array.isArray(emps)   ? emps   : [];
      const deptArr  = Array.isArray(depts)  ? depts  : [];
      const leaveArr = Array.isArray(leaves) ? leaves : [];

      // Build employee id→name map for pending approvals display
      const map = {};
      empArr.forEach(e => { map[e.id] = `${e.first_name} ${e.last_name}`; });
      setEmpMap(map);

      setStats({
        employees:   empArr.length,
        departments: deptArr.length,
        leaves:      leaveArr.length,
      });

      if (isAdmin) setPendingLeaves(leaveArr);
      else         setMyLeaves(leaveArr);
    } catch {}
  }, [authFetch, isAdmin]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleLeaveAction = async (id, action) => {
    setActionLoading(true);
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const res = await authFetch(`/api/v1/hr/leaves/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setMsg(action === 'approve' ? t.leaveApprovedSuccess : t.leaveRejectedSuccess);
      loadStats();
    } catch { setMsg(t.errConn); }
    finally { setActionLoading(false); }
  };

  const anyDown = SERVICES.some(s => statuses[s.key] === 'down');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {anyDown && <Alert type='warning'>Một hoặc nhiều service đang không phản hồi.</Alert>}
      {msg && <Alert type='success' onClose={() => setMsg('')}>{msg}</Alert>}

      {/* Greeting */}
      <Card accent={C.brand}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', color: C.text, fontSize: '20px', fontWeight: '800' }}>
              Xin chào, {user.email.split('@')[0]} 👋
            </h2>
            <p style={{ color: C.textMuted, fontSize: '14px', margin: 0 }}>
              {user.role === 'owner' ? 'Chủ sở hữu' : user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              {' · '}Workspace: {user.tenant_id?.slice(-8) || '—'}
            </p>
          </div>
          <div style={{ backgroundColor: C.bgMid, borderRadius: '10px', padding: '10px 16px', fontSize: '12px', color: C.textMuted, fontFamily: 'monospace' }}>
            <span style={{ fontWeight: '600' }}>{t.traceLabel}</span> {traceId}
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard
          icon='👥' label='Tổng nhân viên'
          value={stats?.employees ?? '…'}
          color={C.brand} bg={C.brandLight}
        />
        <StatCard
          icon='🏢' label='Phòng ban'
          value={stats?.departments ?? '…'}
          color={C.purple} bg={C.purpleBg}
        />
        {isAdmin ? (
          <StatCard
            icon='📋' label='Đơn nghỉ chờ duyệt'
            value={stats?.leaves ?? '…'}
            color={stats?.leaves > 0 ? C.warning : C.success}
            bg={stats?.leaves > 0 ? C.warningBg : C.successBg}
            note={stats?.leaves > 0 ? 'Cần xem xét' : 'Không có đơn mới'}
          />
        ) : (
          <StatCard
            icon='📋' label='Đơn nghỉ của tôi'
            value={stats?.leaves ?? '…'}
            color={C.brandAccent} bg='#e0f7ff'
            note={`${myLeaves.filter(l => l.status === 'pending').length} đang chờ duyệt`}
          />
        )}
      </div>

      {/* Admin: pending leave approvals */}
      {isAdmin && (
        <Card>
          <h4 style={{ margin: '0 0 16px 0', color: C.text, fontSize: '15px', fontWeight: '700' }}>
            📋 Đơn nghỉ phép chờ duyệt
          </h4>
          {pendingLeaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: C.textMuted, fontSize: '14px' }}>
              ✓ Không có đơn nào cần duyệt
            </div>
          ) : (
            <Table headers={['Nhân viên', 'Loại nghỉ', 'Thời gian', 'Thao tác']}>
              {pendingLeaves.map((l, i) => (
                <TR key={i}>
                  <TD style={{ fontWeight: '500' }}>{empMap[l.employee_id] || l.employee_id}</TD>
                  <TD>{l.leave_type}</TD>
                  <TD style={{ color: C.textMuted }}>{l.start_date?.slice(0, 10)} → {l.end_date?.slice(0, 10)}</TD>
                  <TD>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Btn variant='success' size='sm' disabled={actionLoading}
                        onClick={() => handleLeaveAction(l.id, 'approve')}>{t.btnApprove}</Btn>
                      <Btn variant='danger' size='sm' disabled={actionLoading}
                        onClick={() => handleLeaveAction(l.id, 'reject')}>{t.btnReject}</Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </Table>
          )}
        </Card>
      )}

      {/* Employee: my leave summary */}
      {!isAdmin && myLeaves.length > 0 && (
        <Card>
          <h4 style={{ margin: '0 0 16px 0', color: C.text, fontSize: '15px', fontWeight: '700' }}>
            📋 Đơn nghỉ phép gần đây
          </h4>
          <Table headers={['Loại nghỉ', 'Thời gian', 'Trạng thái']}>
            {myLeaves.slice(0, 5).map((l, i) => {
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
        </Card>
      )}

      {/* Service health */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: C.text, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Trạng thái Microservices
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {SERVICES.map(svc => {
            const status = statuses[svc.key];
            const isUp = status === 'up';
            const isPending = status === undefined;
            return (
              <div key={svc.key} style={{
                backgroundColor: C.white, borderRadius: '12px', padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                borderLeft: `3px solid ${isUp ? C.success : isPending ? C.border : C.error}`,
                display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: `linear-gradient(135deg, ${C.brand}20, ${C.brandAccent}30)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                }}>{svc.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>{svc.label}</div>
                  <div style={{ fontSize: '11px', color: C.textLight, fontFamily: 'monospace' }}>:{svc.port}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: isUp ? C.success : isPending ? C.textLight : C.error,
                    boxShadow: isUp ? `0 0 5px ${C.success}` : 'none',
                  }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: isUp ? C.successText : isPending ? C.textLight : C.errorText }}>
                    {isPending ? '…' : isUp ? 'UP' : 'DOWN'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

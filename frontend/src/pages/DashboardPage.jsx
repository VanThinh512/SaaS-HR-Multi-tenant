import React, { useState, useEffect } from 'react';
import { C, Card, Alert } from '../components/ui';

const SERVICES = [
  { key: 'gateway', label: 'API Gateway', icon: '🔀', port: 80,   url: '/api/v1/' },
  { key: 'auth',    label: 'Auth Service', icon: '🔐', port: 8000, url: '/api/v1/auth/health' },
  { key: 'tenant',  label: 'Tenant Service', icon: '🏢', port: 8001, url: '/api/v1/tenants/health' },
  { key: 'hr',      label: 'HR Service',  icon: '👥', port: 8002, url: '/api/v1/hr/health' },
];

export default function DashboardPage({ t, user, authFetch }) {
  const [statuses, setStatuses] = useState({});
  const [traceId] = useState(() => crypto.randomUUID().slice(0, 8).toUpperCase());

  useEffect(() => {
    SERVICES.forEach(svc => {
      authFetch(svc.url)
        .then(r => setStatuses(s => ({ ...s, [svc.key]: r.ok ? 'up' : 'down' })))
        .catch(() => setStatuses(s => ({ ...s, [svc.key]: 'down' })));
    });
  }, [authFetch]);

  const allUp = SERVICES.every(s => statuses[s.key] === 'up');
  const anyDown = SERVICES.some(s => statuses[s.key] === 'down');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview alert */}
      {anyDown && (
        <Alert type='warning'>
          One or more services may be unreachable. Check service health below.
        </Alert>
      )}

      {/* Header card */}
      <Card accent={C.brand}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px 0', color: C.text, fontSize: '20px', fontWeight: '800' }}>{t.dashTitle}</h2>
            <p style={{ color: C.textMuted, fontSize: '14px', lineHeight: '1.7', margin: 0, maxWidth: '680px' }}>{t.dashDesc}</p>
          </div>
          <div style={{ backgroundColor: C.bgMid, borderRadius: '10px', padding: '10px 16px', fontSize: '12px', color: C.textMuted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: '600' }}>{t.traceLabel}</span> {traceId}
          </div>
        </div>
      </Card>

      {/* Service cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {SERVICES.map(svc => {
          const status = statuses[svc.key];
          const isUp = status === 'up';
          const isPending = status === undefined;
          return (
            <div key={svc.key} style={{
              backgroundColor: C.white, borderRadius: '16px', padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
              borderLeft: `4px solid ${isUp ? C.success : isPending ? C.border : C.error}`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: `linear-gradient(135deg, ${C.brand}20, ${C.brandAccent}30)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                }}>{svc.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: isUp ? C.success : isPending ? C.textLight : C.error,
                    boxShadow: isUp ? `0 0 6px ${C.success}` : 'none',
                  }} />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: isUp ? C.successText : isPending ? C.textLight : C.errorText }}>
                    {isPending ? '…' : isUp ? 'UP' : 'DOWN'}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: C.text }}>{svc.label}</div>
                <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '4px' }}>{t.svcDesc[svc.key]}</div>
                <div style={{ fontSize: '11px', color: C.textLight, marginTop: '8px', fontFamily: 'monospace' }}>:{svc.port}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture info card */}
      <Card>
        <h4 style={{ margin: '0 0 16px 0', color: C.text, fontSize: '15px', fontWeight: '700' }}>
          🔐 Security Architecture
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { icon: '🔑', label: 'JWT RS256', desc: 'Asymmetric signing' },
            { icon: '🛡️', label: 'Tenant Isolation', desc: 'Row-level partitioning' },
            { icon: '🔒', label: 'Private Subnet', desc: 'No direct internet access' },
            { icon: '📡', label: 'ALB + CloudFront', desc: 'Edge-to-service routing' },
            { icon: '⚙️', label: 'ECS Fargate', desc: 'Serverless containers' },
            { icon: '🗄️', label: 'RDS Multi-AZ', desc: 'High availability DB' },
          ].map(item => (
            <div key={item.label} style={{ backgroundColor: C.bg, borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: C.text }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: C.textMuted, marginTop: '2px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

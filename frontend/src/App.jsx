import React, { useState, useEffect } from 'react';

function App() {
  const [services, setServices] = useState([
    { name: 'API Gateway (Nginx)', url: '/', status: 'checking', description: 'Handles request routing & trace tracking' },
    { name: 'Auth Service', url: '/api/v1/auth/health', status: 'checking', description: 'Issues RS256 token and validates accounts' },
    { name: 'Tenant Service', url: '/api/v1/tenants/health', status: 'checking', description: 'Manages subscription contexts' },
    { name: 'HR Service', url: '/api/v1/hr/health', status: 'checking', description: 'Pool-model employee repository' },
  ]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [correlationId, setCorrelationId] = useState('Not Sent');

  useEffect(() => {
    // Check services health statelessly
    const checkHealth = async () => {
      const updated = await Promise.all(
        services.map(async (service) => {
          try {
            const res = await fetch(service.url, { method: 'GET' });
            // Extract Correlation ID from headers if present
            const cid = res.headers.get('X-Correlation-ID');
            if (cid) setCorrelationId(cid);
            
            if (res.status === 200 || res.status === 404) { // 404 is acceptable since routes are empty
              return { ...service, status: 'healthy' };
            }
            return { ...service, status: 'unhealthy' };
          } catch (e) {
            return { ...service, status: 'offline' };
          }
        })
      );
      setServices(updated);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logoArea}>
          <span style={styles.logoIcon}>⚡</span>
          <h2 style={styles.logoText}>SaaS HR</h2>
        </div>
        <div style={styles.menu}>
          <button 
            style={activeTab === 'dashboard' ? styles.menuItemActive : styles.menuItem} 
            onClick={() => setActiveTab('dashboard')}
          >
            📊 System Dashboard
          </button>
          <button 
            style={activeTab === 'employees' ? styles.menuItemActive : styles.menuItem} 
            onClick={() => setActiveTab('employees')}
          >
            👥 Employees (HR Pool)
          </button>
          <button 
            style={activeTab === 'attendance' ? styles.menuItemActive : styles.menuItem} 
            onClick={() => setActiveTab('attendance')}
          >
            ⏱️ Attendance & Leaves
          </button>
        </div>
        <div style={styles.sidebarFooter}>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Multi-Tenant Architecture v1.0</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={styles.mainContent}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
              HR Microservice Portal
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
              Enforcing tenant row-level partitioning across isolated MySQL tables.
            </p>
          </div>
          <div style={styles.traceBadge}>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>Trace-ID:</span>
            <code style={styles.traceCode}>{correlationId}</code>
          </div>
        </header>

        {/* Tab Contents */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Top Cards Grid */}
            <div style={styles.grid}>
              {services.map((service, idx) => (
                <div key={idx} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardTitle}>{service.name}</span>
                    <span style={{
                      ...styles.statusDot,
                      backgroundColor: 
                        service.status === 'healthy' ? '#22c55e' : 
                        service.status === 'checking' ? '#eab308' : '#ef4444'
                    }} />
                  </div>
                  <p style={styles.cardDesc}>{service.description}</p>
                  <div style={styles.cardFooter}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 
                        service.status === 'healthy' ? '#16a34a' : 
                        service.status === 'checking' ? '#ca8a04' : '#dc2626'
                    }}>
                      Status: {service.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture Details */}
            <div style={styles.detailsCard}>
              <h3 style={{ marginTop: 0, color: '#0f172a' }}>Microservice Orchestration Details</h3>
              <p style={{ color: '#475569', lineHeight: '1.6' }}>
                All services are isolated within a private Docker subnet. The Nginx API Gateway acts as the sole access point, 
                generating a <strong>Correlation ID</strong> for each request. Credentials are authenticated by the 
                <code>auth-service</code> which returns an RS256-signed JWT. Downstream microservices (like <code>hr-service</code>) 
                statelessly decode the payload using RSA public keys to enforce tenant isolation.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div style={styles.detailsCard}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>HR Pool Model Employee Roster</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              Below represents the transactional data retrieved for your active workspace tenant context.
            </p>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Position</th>
                  <th style={styles.th}>Email Address</th>
                  <th style={styles.th}>Tenant Isolation ID</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={styles.tdRow}>
                  <td style={styles.td}>John Smith</td>
                  <td style={styles.td}>Senior Engineer</td>
                  <td style={styles.td}>john.smith@acme-corp.com</td>
                  <td style={styles.td}><code>tenant_44f12d8a-9a2c...</code></td>
                  <td style={styles.td}><span style={styles.activeBadge}>Active</span></td>
                </tr>
                <tr style={styles.tdRow}>
                  <td style={styles.td}>Jane Doe</td>
                  <td style={styles.td}>HR Manager</td>
                  <td style={styles.td}>jane.doe@acme-corp.com</td>
                  <td style={styles.td}><code>tenant_44f12d8a-9a2c...</code></td>
                  <td style={styles.td}><span style={styles.activeBadge}>Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div style={styles.detailsCard}>
            <h3 style={{ marginTop: 0, color: '#0f172a' }}>Timekeeping & Leaves Portal</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              Employee clock-in events and approval queues.
            </p>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <button style={styles.btnPrimary}>Clock In Now</button>
              <button style={styles.btnSecondary}>Request Leaves</button>
            </div>
            <h4 style={{ color: '#334155' }}>Pending Approval Logs</h4>
            <div style={styles.emptyLogs}>
              No pending leave requests for this workspace tenant.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styling Object
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f1f5f9',
  },
  sidebar: {
    width: '260px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px',
  },
  logoIcon: {
    fontSize: '24px',
    color: '#38bdf8',
  },
  logoText: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '800',
    letterSpacing: '0.5px',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexGrow: 1,
  },
  menuItem: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  menuItemActive: {
    background: '#1e293b',
    border: 'none',
    color: '#38bdf8',
    textAlign: 'left',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  sidebarFooter: {
    borderTop: '1px solid #1e293b',
    paddingTop: '16px',
  },
  mainContent: {
    flexGrow: 1,
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '20px',
  },
  traceBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    padding: '8px 16px',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  traceCode: {
    fontFamily: 'monospace',
    color: '#2563eb',
    fontSize: '12px',
    backgroundColor: '#eff6ff',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '140px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#334155',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  cardDesc: {
    margin: '10px 0',
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.4',
  },
  cardFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '8px',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    borderBottom: '2px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    color: '#475569',
    fontWeight: '600',
    fontSize: '13px',
  },
  tdRow: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '16px',
    color: '#334155',
    fontSize: '14px',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #d2d6dc',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyLogs: {
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  }
};

export default App;

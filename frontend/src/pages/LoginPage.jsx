import React, { useState } from 'react';
import { C, LangToggle, Alert, inputStyle } from '../components/ui';

export default function LoginPage({ onLogin, lang, setLang, t }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, subdomain }),
      });
      if (!res.ok) { setError(t.loginError); return; }
      const data = await res.json();
      onLogin(data.access_token, data.user || { email, role: 'employee' });
    } catch {
      setError(t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0c1a30 100%)',
      fontFamily: 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow effects */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', top: '10%', left: '15%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 70%)', bottom: '10%', right: '15%', pointerEvents: 'none' }} />

      {/* Lang toggle — top right */}
      <div style={{ position: 'absolute', top: 24, right: 24 }}>
        <LangToggle lang={lang} setLang={setLang} />
      </div>

      {/* Login card */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '52px 48px', width: '100%', maxWidth: '440px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.08)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
          }}>⚡</div>
          <h1 style={{ color: C.white, fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
            {t.loginTitle}
          </h1>
          <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: '14px', marginTop: '8px', marginBottom: 0 }}>
            {t.loginSubtitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && <Alert type='error' onClose={() => setError('')}>{error}</Alert>}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'rgba(203,213,225,0.9)' }}>
              {t.labelSubdomain}
            </label>
            <input
              type='text' required value={subdomain} onChange={e => setSubdomain(e.target.value)}
              placeholder={t.placeholderSubdomain}
              style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: C.white }}
              onFocus={e => { e.target.style.borderColor = C.brandAccent; e.target.style.boxShadow = `0 0 0 3px rgba(56,189,248,0.15)`; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'rgba(203,213,225,0.9)' }}>
              {t.labelEmail}
            </label>
            <input
              type='email' required value={email} onChange={e => setEmail(e.target.value)}
              placeholder={t.placeholderEmail}
              style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: C.white }}
              onFocus={e => { e.target.style.borderColor = C.brandAccent; e.target.style.boxShadow = `0 0 0 3px rgba(56,189,248,0.15)`; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: 'rgba(203,213,225,0.9)' }}>
              {t.labelPassword}
            </label>
            <input
              type='password' required value={password} onChange={e => setPassword(e.target.value)}
              placeholder='••••••••'
              style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', color: C.white }}
              onFocus={e => { e.target.style.borderColor = C.brandAccent; e.target.style.boxShadow = `0 0 0 3px rgba(56,189,248,0.15)`; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button
            type='submit' disabled={loading}
            style={{
              padding: '13px', borderRadius: '10px', border: 'none',
              background: loading ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg, #2563eb, #38bdf8)',
              color: C.white, fontWeight: '700', fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
              transition: 'all 0.2s', marginTop: '4px',
            }}
          >
            {loading ? t.btnLoggingIn : t.btnLogin}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(100,116,139,0.7)', fontSize: '12px', marginTop: '28px', marginBottom: 0 }}>
          {t.loginFooter}
        </p>
      </div>
    </div>
  );
}

import { useRef, useEffect, useCallback } from 'react';

export function useAuthedFetch(token, onTokenUpdate, onExpire) {
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  return useCallback(async (url, options = {}) => {
    const buildHeaders = (t) => ({
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${t}`,
    });

    let res = await fetch(url, { ...options, headers: buildHeaders(tokenRef.current) });

    if (res.status === 401) {
      try {
        const refreshRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenRef.current}`, 'Content-Type': 'application/json' },
        });
        if (refreshRes.ok) {
          const { access_token } = await refreshRes.json();
          tokenRef.current = access_token;
          onTokenUpdate(access_token);
          res = await fetch(url, { ...options, headers: buildHeaders(access_token) });
        } else {
          onExpire();
        }
      } catch {
        onExpire();
      }
    }

    return res;
  }, [onTokenUpdate, onExpire]);
}

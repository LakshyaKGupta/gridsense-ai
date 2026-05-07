import type { UserProfile } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

type SessionResponse = {
  access_token: string;
  token_type: string;
};

type SessionEnvelope = {
  success?: boolean;
  data?: SessionResponse;
  detail?: string;
  message?: string;
};

export async function issueBackendSession(upstreamToken: string, profile: UserProfile): Promise<string> {
  // For demo users, generate a local JWT-like token if backend is unavailable
  if (profile.isDemo) {
    try {
      const response = await fetch(`${API_URL}/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upstream_token: upstreamToken,
          uid: profile.uid,
          email: profile.email,
          role: profile.role,
          name: profile.name,
          is_demo: true,
        }),
      });
      if (!response.ok) throw new Error('Backend session failed');
      const payload = (await response.json().catch(() => null)) as SessionEnvelope | SessionResponse | null;
      const tokenPayload =
        payload && typeof payload === 'object' && 'data' in payload && payload.data
          ? payload.data
          : payload && 'access_token' in payload
            ? payload
            : null;
      if (tokenPayload) return tokenPayload.access_token;
    } catch {
      /* fallback to local demo token below */
    }
    // Fallback local demo token (base64 encoded JSON) for offline/demo usage
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const body = btoa(JSON.stringify({
      sub: profile.email,
      uid: profile.uid,
      role: profile.role,
      name: profile.name,
      is_demo: true,
      auth_source: 'demo',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 * 12,
    }));
    return `${header}.${body}.`;
  }

  const response = await fetch(`${API_URL}/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      upstream_token: upstreamToken,
      uid: profile.uid,
      email: profile.email,
      role: profile.role,
      name: profile.name,
      is_demo: Boolean(profile.isDemo),
    }),
  });

  const payload = (await response.json().catch(() => null)) as SessionEnvelope | SessionResponse | null;
  const tokenPayload =
    payload && typeof payload === 'object' && 'data' in payload && payload.data
      ? payload.data
      : payload && 'access_token' in payload
        ? payload
        : null;

  if (!response.ok || !tokenPayload) {
    throw new Error(
      (payload && typeof payload === 'object' && ('detail' in payload || 'message' in payload) && (payload.detail || payload.message)) || 'Unable to establish backend session',
    );
  }

  return tokenPayload.access_token;
}

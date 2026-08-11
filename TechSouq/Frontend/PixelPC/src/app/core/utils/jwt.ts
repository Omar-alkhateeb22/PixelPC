// ASP.NET Core maps short claim names (e.g. "role") to their full
// wsxmlsoft claim-schema URIs inside the JWT unless explicitly configured
// otherwise, so the long form is checked first.
const ROLE_CLAIM_KEYS = [
  'http://schemas.xmlsoft.org/ws/2005/05/identity/claims/role',
  'Role',
  'role',
];

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function extractRoleClaim(payload: Record<string, unknown> | null): string | null {
  if (!payload) {
    return null;
  }

  for (const key of ROLE_CLAIM_KEYS) {
    const value = payload[key];
    if (typeof value === 'string') {
      return value;
    }
  }

  return null;
}

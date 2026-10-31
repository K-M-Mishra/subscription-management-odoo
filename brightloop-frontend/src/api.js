const BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');
export function queryString(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) q.set(k, v);
  });
  return q.size ? '?' + q : '';
}
export async function api(path, { method = 'GET', body, blob = false } = {}) {
  const token = localStorage.getItem('token');
  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      'Cannot reach the backend. Run npm run dev from the project root.',
    );
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    if (response.status === 401 && !path.startsWith('/auth/')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('brightloop:logout'));
    }
    throw new Error(
      Object.values(result.error?.fields || {}).join(' ') ||
        result.error?.message ||
        result.message ||
        `Request failed (${response.status})`,
    );
  }
  return blob ? response.blob() : response.json();
}
export async function downloadInvoice(id, portal = false, preview = false) {
  const blob = await api(`${portal ? '/portal' : ''}/invoices/${id}/download`, {
    blob: true,
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  if (preview) {
    a.target = '_blank';
    a.rel = 'noopener';
  } else a.download = `invoice-${id}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

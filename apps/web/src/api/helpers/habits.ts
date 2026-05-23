const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

// Reads the JWT from localStorage for every request.
// Returns headers with Authorization + Content-Type.
function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// If the API returns 401, the token has expired or is missing.
// Clear it and redirect to /login so the user can re-authenticate.
function handleUnauthorized() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (res.status === 401) { handleUnauthorized(); throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 401) { handleUnauthorized(); throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

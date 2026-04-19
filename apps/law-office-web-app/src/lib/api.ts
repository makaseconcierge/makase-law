export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export const API_URL = `${API_BASE}/office`;

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function authHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (_accessToken) headers["Authorization"] = `Bearer ${_accessToken}`;
  return headers;
}

export interface MatterSummary {
  id: string;
  type: string;
  data: Record<string, unknown>;
  status: string;
  created_at: string;
}

export interface FormSummary {
  id: string;
  form_type: string;
  form_data: Record<string, unknown>;
  status: string;
  created_at: string;
}

export interface MatterDetail extends MatterSummary {
  forms: FormSummary[];
}

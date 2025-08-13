export async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const json = await res.json().catch(() => null);
  if (!res.ok || (json && json.success === false)) {
    const message = json?.error?.message || `API error: ${res.status}`;
    throw new Error(message);
  }
  return (json as T);
}



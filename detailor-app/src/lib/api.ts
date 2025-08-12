export async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()) as T;
}



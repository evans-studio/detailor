export async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  try {
    const json = await res.json();
    if (!res.ok || (json && json.success === false)) {
      const message = json?.error?.message || `API error: ${res.status}`;
      throw new Error(message);
    }
    return (json as T);
  } catch (e) {
    // If JSON parsing fails for a supposedly OK response, surface parsing error as tests expect
    if (res.ok) {
      throw e instanceof Error ? e : new Error('Invalid JSON');
    }
    // For non-ok responses without JSON, throw based on status
    throw new Error(`API error: ${res.status}`);
  }
}



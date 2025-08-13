"use client";
export type QueuedRequest = { id: string; url: string; method: string; headers?: Record<string,string>; body?: unknown };

const KEY = 'offlineQueue';

export function enqueueRequest(req: Omit<QueuedRequest,'id'>) {
  const q = getQueue();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  q.push({ id, ...req });
  localStorage.setItem(KEY, JSON.stringify(q));
  return id;
}

export function getQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch { return []; }
}

export async function flushQueue() {
  const q = getQueue();
  const remaining: QueuedRequest[] = [];
  for (const item of q) {
    try {
      const res = await fetch(item.url, { method: item.method, headers: item.headers, body: item.body ? JSON.stringify(item.body) : undefined });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      remaining.push(item);
    }
  }
  localStorage.setItem(KEY, JSON.stringify(remaining));
  return { flushed: q.length - remaining.length, remaining: remaining.length };
}



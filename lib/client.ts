export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Fetch a JSON API route and unwrap the { ok, data, error } envelope.
 * Throws ApiError on failure so callers can try/catch cleanly.
 */
export async function api<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // non-JSON response
  }

  if (!res.ok || payload?.ok === false) {
    throw new ApiError(
      res.status,
      payload?.error || `Request failed (${res.status}).`
    );
  }
  return payload?.data as T;
}

export type FetchFn = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export async function getJson(
  url: string,
  fetchFn: FetchFn = fetch
): Promise<unknown> {
  const res = await fetchFn(url, {
    headers: {
      accept: "application/json"
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${url} failed with ${res.status}: ${body}`);
  }

  return res.json();
}

export async function postJson(
  url: string,
  payload: unknown,
  fetchFn: FetchFn = fetch
): Promise<unknown> {
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST ${url} failed with ${res.status}: ${body}`);
  }

  return res.json();
}

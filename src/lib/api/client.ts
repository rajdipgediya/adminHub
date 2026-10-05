export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://dummyjson.com";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { signal });
  if (!res.ok) {
    throw new ApiError(
      res.status === 404
        ? "The requested record could not be found."
        : `Request failed with status ${res.status}.`,
      res.status,
    );
  }
  return res.json() as Promise<T>;
}

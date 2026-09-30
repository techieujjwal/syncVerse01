import type { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * Extract a human-readable message from a supabase.functions.invoke error.
 *
 * supabase-js reduces every non-2xx edge-function response to the generic
 * "Edge Function returned a non-2xx status code", hiding the real cause
 * (429 rate limit, 503 missing secret, 502 malformed AI output...). The raw
 * Response is attached as `context` on FunctionsHttpError, so read the JSON
 * body our edge functions actually send ({ error: string }).
 */
export async function getEdgeErrorMessage(error: unknown): Promise<string> {
  const ctx = (error as { context?: unknown } | null)?.context;
  if (ctx && typeof (ctx as Response).json === "function") {
    const response = ctx as Response;
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && typeof (body as Record<string, unknown>).error === "string"
        ? ((body as Record<string, unknown>).error as string)
        : null;
    if (message) return message;
    if (response.status === 429) {
      return "The AI service is rate-limited right now. Please wait a minute and try again.";
    }
    if (response.status >= 500) {
      return `The AI service had a server error (${response.status}). Please try again in a moment.`;
    }
    return `Request failed with status ${response.status}.`;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Request failed. Check your connection and try again.";
}

/** True when the thrown error is a FunctionsHttpError (non-2xx edge response). */
export function isFunctionsHttpError(error: unknown): error is FunctionsHttpError {
  return (
    error instanceof Error &&
    (error.name === "FunctionsHttpError" ||
      // Older supabase-js builds expose the same shape without the name.
      typeof (error as { context?: unknown })?.context === "object")
  );
}

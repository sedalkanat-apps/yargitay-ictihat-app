import "@supabase/functions-js/edge-runtime.d.ts";
import { error } from "../_shared/response.ts";

Deno.serve((req) => {
  const requestId = crypto.randomUUID();

  if (req.method !== "GET") {
    return error(405, "METHOD_NOT_ALLOWED", "Method Not Allowed", requestId);
  }

  return error(501, "NOT_IMPLEMENTED", "Endpoint not implemented yet", requestId);
});

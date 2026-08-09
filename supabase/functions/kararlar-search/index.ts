import "@supabase/functions-js/edge-runtime.d.ts";
import { error } from "../_shared/response.ts";

Deno.serve((_req) => {
  const requestId = crypto.randomUUID();

  return error(501, "NOT_IMPLEMENTED", "Endpoint not implemented yet", requestId);
});

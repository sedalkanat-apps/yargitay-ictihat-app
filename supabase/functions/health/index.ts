import "@supabase/functions-js/edge-runtime.d.ts";
import { success, error } from "../_shared/response.ts";

Deno.serve((req) => {
  const requestId = crypto.randomUUID();

  if (req.method !== "GET") {
    return error(405, "METHOD_NOT_ALLOWED", "Method Not Allowed", requestId);
  }

  return success(
    {
      status: "ok",
      service: "yargitay-ictihat-api",
      timestamp: new Date().toISOString(),
    },
    requestId,
  );
});

import "@supabase/functions-js/edge-runtime.d.ts";
import { error } from "../_shared/response.ts";

Deno.serve((req) => {
  const requestId = crypto.randomUUID();

  if (req.method !== "GET") {
    return error(405, "METHOD_NOT_ALLOWED", "Method Not Allowed", requestId);
  }

  const searchParams = new URL(req.url).searchParams;

  const q = searchParams.get("q");
  if (!q || q.trim() === "") {
    return error(400, "INVALID_QUERY", "Query parameter 'q' is required", requestId);
  }

  const pageParam = searchParams.get("page");
  let page = 1;
  if (pageParam !== null) {
    if (!/^\d+$/.test(pageParam) || Number(pageParam) < 1) {
      return error(400, "INVALID_PAGE", "Query parameter 'page' must be a positive integer", requestId);
    }
    page = Number(pageParam);
  }

  return error(501, "NOT_IMPLEMENTED", "Endpoint not implemented yet", requestId);
});

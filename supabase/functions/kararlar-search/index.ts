import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { success, error } from "../_shared/response.ts";

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    },
  );

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

  const limitParam = searchParams.get("limit");
  let limit = 20;
  if (limitParam !== null) {
    if (!/^\d+$/.test(limitParam) || Number(limitParam) < 1 || Number(limitParam) > 100) {
      return error(400, "INVALID_LIMIT", "Query parameter 'limit' must be between 1 and 100", requestId);
    }
    limit = Number(limitParam);
  }

  const sortParam = searchParams.get("sort");
  let sort = "relevance";
  if (sortParam !== null) {
    if (sortParam !== "relevance" && sortParam !== "date") {
      return error(400, "INVALID_SORT", "Query parameter 'sort' must be 'relevance' or 'date'", requestId);
    }
    sort = sortParam;
  }

  const { error: dbError } = await supabase.from("kararlar").select("id").limit(1);
  if (dbError) {
    return error(500, "DATABASE_ERROR", dbError.message, requestId);
  }

  return success({ connected: true }, requestId);
});

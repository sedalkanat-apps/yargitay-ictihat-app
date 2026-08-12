import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { success, error, CORS_HEADERS } from "../_shared/response.ts";

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

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

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

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let dbQuery = supabase
    .from("kararlar")
    .select("id, mahkeme, daire, esas_no, karar_no, tarih, hukuk_dali, ozet")
    .textSearch("arama_vektoru", q, { type: "plain", config: "simple" })
    .range(from, to);

  // kararlar_arama_vektoru_idx bir ts_rank fonksiyonu içermiyor, bu yüzden
  // sort=relevance için ek bir sıralama uygulanmıyor (eşleşme sırası kullanılır);
  // sort=date için tarih alanına göre en yeniden en eskiye sıralanır.
  if (sort === "date") {
    dbQuery = dbQuery.order("tarih", { ascending: false });
  }

  const { data, error: dbError } = await dbQuery;
  if (dbError) {
    return error(500, "DATABASE_ERROR", dbError.message, requestId);
  }

  return success({ query: q, page, limit, sort, results: data }, requestId);
});

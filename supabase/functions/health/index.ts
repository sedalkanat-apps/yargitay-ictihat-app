import "@supabase/functions-js/edge-runtime.d.ts";

Deno.serve((req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  return Response.json({
    status: "ok",
    service: "yargitay-ictihat-api",
    timestamp: new Date().toISOString(),
  });
});

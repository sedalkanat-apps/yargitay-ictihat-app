export const CORS_HEADERS: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function success(data: unknown, requestId: string): Response {
  return Response.json(
    {
      success: true,
      version: "v1",
      requestId,
      data,
    },
    { headers: CORS_HEADERS },
  );
}

export function error(status: number, code: string, message: string, requestId: string): Response {
  return Response.json(
    {
      success: false,
      version: "v1",
      requestId,
      error: {
        code,
        message,
      },
    },
    { status, headers: CORS_HEADERS },
  );
}

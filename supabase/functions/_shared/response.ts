export function success(data: unknown, requestId: string): Response {
  return Response.json({
    success: true,
    version: "v1",
    requestId,
    data,
  });
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
    { status },
  );
}

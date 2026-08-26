export default function onRequest() {
  return new Response(JSON.stringify({
    ok: true,
    service: "uchikoshi-learning-games",
    functions: "online"
  }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

// A short-lived completion capability bound to one saved assessment, not a login token.
const encoder = new TextEncoder();
const TTL = 15 * 60 * 1000;
async function key(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function completionReceipt(id: string, secret: string, now = Date.now()) {
  const payload = `${id}:${now + TTL}`;
  const signature = await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(`fundability-completion:${payload}`));
  return `${payload}:${Array.from(new Uint8Array(signature), (v) => v.toString(16).padStart(2, "0")).join("")}`;
}
export async function verifyCompletionReceipt(id: string, receipt: string, secret: string, now = Date.now()) {
  const [boundId, expires, hex, extra] = receipt.split(":");
  const expiry = Number(expires);
  if (extra || boundId !== id || !Number.isFinite(expiry) || expiry <= now || expiry > now + TTL || !/^[a-f0-9]{64}$/.test(hex ?? "")) return false;
  const bytes = new Uint8Array(hex.match(/.{2}/g)?.map((v) => parseInt(v, 16)) ?? []);
  return crypto.subtle.verify("HMAC", await key(secret), bytes, encoder.encode(`fundability-completion:${boundId}:${expires}`));
}
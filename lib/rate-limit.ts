/**
 * Limiteur de débit en mémoire, par IP et par fenêtre glissante.
 *
 * Suffisant pour protéger les routes publiques d'un usage abusif basique.
 * Limite connue : l'état vit dans l'instance serverless, il n'est donc pas
 * partagé entre régions/instances. Pour une limite stricte à l'échelle du
 * déploiement, brancher un store externe (Upstash Redis, Vercel KV).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Purge périodique pour éviter que la Map ne grossisse indéfiniment. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Secondes avant réinitialisation du quota. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);

  if (bucket.count > limit) {
    return { success: false, remaining: 0, retryAfter };
  }

  return { success: true, remaining: limit - bucket.count, retryAfter };
}

/** Identifie l'appelant derrière les proxies (Vercel, reverse proxy). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

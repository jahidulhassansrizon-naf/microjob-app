/**
 * Server-safe list of paid /sohoj-tools slugs.
 *
 * Keep this list in sync with the tools marked `access: "paid"` in the client-side
 * toolsData.tsx registry. The server uses it to render a locked subscription screen
 * instead of hydrating the actual paid tool for users without active access. Any
 * paid server operation must still enforce requireActiveSubscription() itself;
 * a page-level check is not a substitute for an API guard.
 */
export const PAID_TOOL_SLUGS: ReadonlySet<string> = new Set([
  "nid-joiner",
  "document-scanner",
  "govt-job-photo-sign-resizer",
  "remove-background",
  "image-size-reducer",
  "image-upscaler",
  "reduce-video-file-size",
  "change-speed",
  "add-watermark",
]);

export function isPaidToolSlug(slug: string): boolean {
  return PAID_TOOL_SLUGS.has(slug);
}

/**
 * Webinar cover-image helpers.
 *
 * Client-safe on purpose — imported by components as well as by the API
 * routes, so keep it free of mongoose / aws-sdk / node builtins.
 */

/**
 * Shown whenever a webinar has no uploaded cover image.
 *
 * A real photograph (not an SVG placeholder) so a card without an upload
 * still looks like part of the site. Swap `public/placeholders/webinar.jpg`
 * for any other 16:9 image to change it — no code change needed.
 */
export const WEBINAR_FALLBACK_IMAGE = "/placeholders/webinar.jpg";

/** The image to render for a webinar — the uploaded one, or the fallback. */
export function webinarImage(webinar?: {
  imageUrl?: string | null;
  displayImageUrl?: string | null;
} | null): string {
  return (
    webinar?.displayImageUrl?.trim() ||
    webinar?.imageUrl?.trim() ||
    WEBINAR_FALLBACK_IMAGE
  );
}

/**
 * Add `displayImageUrl` to a serialized webinar before sending it out of an
 * API route. `imageUrl` stays exactly as stored (so the dashboard can tell
 * "no image uploaded" from "image uploaded"), while every consumer of the
 * API gets a URL it can render straight away.
 */
export function withWebinarImage<T extends Record<string, any>>(doc: T): T {
  if (!doc) return doc;
  return { ...doc, displayImageUrl: webinarImage(doc) };
}

import type { HeroSlideItem } from "./types";

/**
 * Slides shown when nothing has been added in the dashboard yet.
 *
 * These point at files in `/public`, not at S3, so the homepage always has
 * something real to show on a fresh install. A superadmin can either upload
 * their own slides (these then disappear) or press "Load these as editable
 * slides" on /admin/hero to copy them into the database and edit the copy.
 *
 * This file is imported by a client component — keep it free of any server
 * imports (mongoose, aws-sdk, node builtins).
 */
export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    _id: "default-careers",
    title: "Empowering Careers.\nBuilding Futures.",
    description:
      "URAV is a corporate consulting and career platform that connects students, professionals and organizations through learning, webinars and job opportunities.",
    desktopImageUrl: "/hero-students.webp",
    mobileImageUrl: "/hero-students.webp",
    textTone: "light",
    order: 0,
    active: true,
  },
  {
    _id: "default-webinars",
    title: "Learn from people who\nhave done the job.",
    description:
      "Live sessions with industry mentors on interviews, skills and career paths — free for every registered student.",
    desktopImageUrl: "/hero/default-webinars-desktop.svg",
    mobileImageUrl: "/hero/default-webinars-mobile.svg",
    textTone: "light",
    order: 1,
    active: true,
  },
  {
    _id: "default-jobs",
    title: "Your next opportunity\nis already listed.",
    description:
      "Roles posted directly by verified recruiters. Build your profile once, then apply with a single click.",
    desktopImageUrl: "/hero/default-jobs-desktop.svg",
    mobileImageUrl: "/hero/default-jobs-mobile.svg",
    textTone: "light",
    order: 2,
    active: true,
  },
];

/** Pick the right image for a viewport, falling back to the desktop one. */
export function slideImage(
  slide: Pick<HeroSlideItem, "desktopImageUrl" | "mobileImageUrl">,
  view: "desktop" | "mobile"
): string {
  if (view === "mobile") return slide.mobileImageUrl || slide.desktopImageUrl;
  return slide.desktopImageUrl;
}

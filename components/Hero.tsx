"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Video, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { DEFAULT_HERO_SLIDES, slideImage } from "@/lib/heroDefaults";
import type { HeroSlideItem } from "@/lib/types";

/** How long each slide stays up before advancing, in ms. */
const AUTOPLAY_MS = 6000;

const btnBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md px-6 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export function Hero() {
  const [slides, setSlides] = useState<HeroSlideItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  /* Slides come from the dashboard. An empty collection is normal on a fresh
     install — we fall back to the built-in defaults so the homepage is never
     blank. */
  useEffect(() => {
    let cancelled = false;
    api<HeroSlideItem[]>("/api/hero-slides")
      .then((data) => {
        if (cancelled) return;
        setSlides(data.length > 0 ? data : DEFAULT_HERO_SLIDES);
      })
      .catch(() => {
        if (!cancelled) setSlides(DEFAULT_HERO_SLIDES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const count = slides?.length ?? 0;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  /* Autoplay. Stops while the pointer is over the slider, while a control
     inside it has focus, and when the tab is in the background. */
  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduceMotion]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    delta < 0 ? next() : prev();
  }

  if (!slides) return <HeroSkeleton />;
  if (count === 0) return null;

  return (
    <section className="bg-white">
      <div
        className="group relative overflow-hidden bg-dark"
        role="region"
        aria-roledescription="carousel"
        aria-label="URAV highlights"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Track */}
        <div
          className={`flex h-[540px] md:h-[500px] lg:h-[580px] ${
            reduceMotion ? "" : "transition-transform duration-700 ease-out"
          }`}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => {
            const active = i === index;
            const light = (slide.textTone ?? "light") !== "dark";
            return (
              <div
                key={slide._id}
                className="relative h-full w-full shrink-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!active}
              >
                {/* Separate crops for phone and desktop — the browser only
                    downloads the one it needs. */}
                <picture>
                  <source
                    media="(max-width: 767px)"
                    srcSet={slideImage(slide, "mobile")}
                  />
                  <img
                    src={slideImage(slide, "desktop")}
                    alt=""
                    loading={i === 0 ? "eager" : "lazy"}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </picture>

                {/* Scrim so the copy stays readable over any photo. */}
                <div
                  className={
                    light
                      ? "absolute inset-0 bg-gradient-to-t from-dark/85 via-dark/60 to-dark/25 md:bg-gradient-to-r md:from-dark/85 md:via-dark/55 md:to-transparent"
                      : "absolute inset-0 bg-gradient-to-t from-white/90 via-white/70 to-white/30 md:bg-gradient-to-r md:from-white/92 md:via-white/70 md:to-transparent"
                  }
                />

                <div className="container-page relative flex h-full items-end pb-16 md:items-center md:pb-0">
                  <div className="max-w-xl">
                    <SlideTitle
                      text={slide.title}
                      primary={i === 0}
                      className={light ? "text-white" : "text-dark"}
                    />
                    {slide.description && (
                      <p
                        className={`mt-5 max-w-md text-base leading-relaxed ${
                          light ? "text-white/85" : "text-slate-600"
                        }`}
                      >
                        {slide.description}
                      </p>
                    )}

                    {(slide.ctaLabel || slide.secondaryCtaLabel) && (
                      <div className="mt-8 flex flex-wrap gap-4">
                        {slide.ctaLabel && slide.ctaHref && (
                          <Link
                            href={slide.ctaHref}
                            tabIndex={active ? 0 : -1}
                            className={`${btnBase} bg-primary text-white hover:bg-primary-hover focus-visible:ring-white/70`}
                          >
                            {slide.ctaLabel}
                          </Link>
                        )}
                        {slide.secondaryCtaLabel && slide.secondaryCtaHref && (
                          <Link
                            href={slide.secondaryCtaHref}
                            tabIndex={active ? 0 : -1}
                            className={`${btnBase} ${
                              light
                                ? "border border-white/70 text-white hover:bg-white hover:text-dark focus-visible:ring-white/70"
                                : "border border-slate-300 text-dark hover:bg-light focus-visible:ring-primary/50"
                            }`}
                          >
                            {slide.secondaryCtaLabel}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            <Arrow side="left" onClick={prev} />
            <Arrow side="right" onClick={next} />

            <div className="absolute inset-x-0 bottom-12 flex justify-center gap-2.5">
              {slides.map((slide, i) => (
                <button
                  key={slide._id}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                    i === index
                      ? "w-7 bg-white"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>

            <p className="sr-only" aria-live="polite">
              Slide {index + 1} of {count}: {slides[index].title}
            </p>
          </>
        )}
      </div>

      {/* Kept from the previous hero — the two headline numbers. */}
      <div className="container-page relative z-10">
        <div className="-mt-7 grid gap-3 sm:-mt-8 sm:grid-cols-2 sm:gap-4">
          <Stat
            icon={<Video className="h-5 w-5" />}
            label="Webinars"
            value="120+"
          />
          <Stat
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Placed"
            value="2.5K+"
            tone="success"
          />
        </div>
      </div>
    </section>
  );
}

/** Only the first slide gets the page's single `h1`. */
function SlideTitle({
  text,
  primary,
  className,
}: {
  text: string;
  primary: boolean;
  className: string;
}) {
  const lines = text.split("\n");
  const content = lines.map((line, i) => (
    <span key={i} className="block">
      {line}
    </span>
  ));
  const classes = `h1 text-[32px] leading-[40px] sm:text-[40px] sm:leading-[48px] ${className}`;
  return primary ? (
    <h1 className={classes}>{content}</h1>
  ) : (
    <h2 className={classes}>{content}</h2>
  );
}

function Arrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      className={`absolute top-1/2 hidden -translate-y-1/2 place-items-center rounded-full bg-white/15 p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:grid ${
        side === "left" ? "left-4" : "right-4"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "success";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg">
      <span
        className={`grid h-9 w-9 place-items-center rounded-md ${
          tone === "success"
            ? "bg-success/10 text-success"
            : "bg-primary-light text-primary"
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-heading text-lg font-bold text-dark">{value}</p>
      </div>
    </div>
  );
}

/** Shimmer placeholder shown while the slides are being fetched. */
function HeroSkeleton() {
  return (
    <section className="bg-white">
      <div className="relative h-[540px] overflow-hidden bg-slate-200/70 md:h-[500px] lg:h-[580px]">
        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <div className="container-page relative flex h-full items-end pb-16 md:items-center md:pb-0">
          <div className="w-full max-w-xl space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-11 w-44 rounded-md" />
              <Skeleton className="h-11 w-36 rounded-md" />
            </div>
          </div>
        </div>
      </div>
      <div className="container-page relative z-10">
        <div className="-mt-7 grid gap-3 sm:-mt-8 sm:grid-cols-2 sm:gap-4">
          <Skeleton className="h-[66px] rounded-xl" />
          <Skeleton className="h-[66px] rounded-xl" />
        </div>
      </div>
    </section>
  );
}

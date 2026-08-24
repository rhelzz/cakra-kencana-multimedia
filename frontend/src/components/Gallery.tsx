'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { t, type Locale } from '@/lib/i18n';

export type Slide = { id: number; src: string; alt: string };

const AUTOPLAY_MS = 5000;

export function Gallery({ slides, locale }: { slides: Slide[]; locale: Locale }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const sync = () => setCurrent(api.selectedScrollSnap());
    sync();
    api.on('select', sync);
    return () => {
      api.off('select', sync);
    };
  }, [api]);

  useEffect(() => {
    if (!api || paused || slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // `current` in the deps restarts the timer after every slide change, including manual
    // ones — so clicking an arrow doesn't leave a half-elapsed timer about to fire.
    const timer = setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [api, paused, current, slides.length]);

  if (slides.length === 0) return null;
  const ui = t(locale);

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: slides.length > 1 }}
      className="w-full"
      aria-label={ui.navigation}
      // Stop advancing while someone is reading or tabbing through the controls.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <CarouselContent>
        {slides.map((s) => (
          <CarouselItem key={s.id}>
            <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted">
              {/* Plain <img>: the src is a runtime Joomla URL, so next/image would need remotePatterns. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} className="size-full object-cover" loading="lazy" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>

      {slides.length > 1 && (
        <>
          <CarouselPrevious className="left-3 size-10 bg-background/70 backdrop-blur" />
          <CarouselNext className="right-3 size-10 bg-background/70 backdrop-blur" />

          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={paused ? ui.resumeCarousel : ui.pauseCarousel}
              className="grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`${ui.goToSlide} ${i + 1}`}
                aria-current={i === current}
                className={cn(
                  'size-2 rounded-full transition-all',
                  i === current ? 'w-5 bg-white' : 'bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        </>
      )}
    </Carousel>
  );
}

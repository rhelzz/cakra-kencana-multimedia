'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { localePath, t, type Locale } from '@/lib/i18n';

type Item = { id: string; title: string; href: string };

/**
 * "#about" is a position on this page, not a route — a plain anchor scrolls there
 * (smoothly, via CSS) instead of pushing a navigation through the router.
 */
function NavLink({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function SiteHeader({
  items,
  logo,
  siteName,
  locale,
}: {
  items: Item[];
  logo: string;
  siteName: string;
  locale: Locale;
}) {
  const ui = t(locale);
  const pathname = usePathname();
  const base = localePath(locale) === '/' ? '' : localePath(locale);
  // "#about" only resolves on the home page; from a detail page it has to go home first.
  const atHome = pathname === (base || '/');
  const resolve = (href: string) => (href.startsWith('#') && !atHome ? `${base}/${href}` : href);
  // The header starts tall and transparent over the hero, then shrinks and earns a solid
  // background once you've scrolled past that first section. Only the home page has a dark
  // hero to float over — everywhere else it's solid and compact from the start, or its white
  // text vanishes. The trigger is the viewport height, not a fixed pixel count, because the
  // hero is sized in svh.
  const [scrolledPast, setScrolledPast] = useState(false);
  const scrolled = scrolledPast || !atHome;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300 motion-reduce:transition-none',
        scrolled
          ? 'border-b border-border bg-background/80 text-foreground backdrop-blur-md'
          : 'border-b border-transparent text-white',
      )}
    >
      <nav
        className={cn(
          'mx-auto flex max-w-6xl items-center gap-3 px-4 transition-[height] duration-300 motion-reduce:transition-none sm:gap-6 sm:px-6',
          scrolled ? 'h-20' : 'h-24 md:h-32',
        )}
      >
        {/* Over the hero the mark is the company name set as type — white, so it reads on the
            photo, which the dark full-colour logo does not. Once the bar goes solid there is a
            light background to sit on and it becomes the logo itself. */}
        {/* Both marks are always rendered, stacked in one grid cell and cross-faded, so the
            link keeps a stable width and nothing reflows mid-transition. The <img> is
            decorative (alt="") — the always-present text is what names the link. */}
        <NavLink
          href={resolve('#top')}
          className="grid min-w-0 max-w-[10rem] flex-1 items-center *:col-start-1 *:row-start-1 sm:max-w-none sm:flex-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt=""
            className={cn(
              // A concrete height, not h-full: inside the grid, a percentage height would
              // resolve against an auto-sized row whose height is this image — circular, so
              // the browser falls back to the PNG's natural 341px and it bursts out of the bar.
              // The logo only ever shows while the bar is `h-20` (80px).
              'h-13 w-auto justify-self-start transition-opacity duration-300 motion-reduce:transition-none',
              scrolled ? 'opacity-100' : 'opacity-0',
            )}
          />
          <span
            className={cn(
              'truncate whitespace-nowrap text-sm font-semibold uppercase leading-tight tracking-wide transition-opacity duration-300 motion-reduce:transition-none',
              scrolled ? 'opacity-0' : 'opacity-100',
            )}
          >
            {siteName}
          </span>
        </NavLink>

        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {items.map((i) => {
            const active = !i.href.startsWith('#') && pathname === resolve(i.href);
            return (
            <li key={i.id}>
              <NavLink
                href={resolve(i.href)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold tracking-[0.015em] transition-colors',
                  active
                    ? scrolled ? 'bg-accent text-accent-foreground' : 'bg-white/10'
                    : scrolled ? 'hover:bg-accent hover:text-accent-foreground' : 'hover:bg-white/10',
                )}
              >
                {i.title}
              </NavLink>
            </li>
            );
          })}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle locale={locale} />

          <Sheet open={open} onOpenChange={setOpen}>
            {/* Base UI (not Radix) is the primitive here, so composition uses `render`, not `asChild`. */}
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="size-10 shrink-0 md:hidden" aria-label={ui.menu} />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,calc(100vw-1rem))] border-l-2 border-primary bg-background px-0 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3">
              <SheetHeader className="border-b border-border px-5 pb-5 pr-14 pt-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="" className="h-10 w-auto shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-primary">
                      {ui.navigation}
                    </p>
                    <SheetTitle className="mt-1 truncate text-lg font-semibold">{siteName}</SheetTitle>
                  </div>
                </div>
              </SheetHeader>
              <Separator className="bg-primary/20" />
              <ul className="flex flex-col gap-1 px-3 py-4">
                {items.map((i, index) => {
                  const resolvedHref = resolve(i.href);
                  const active = !i.href.startsWith('#') && pathname === resolvedHref;
                  return (
                    <li key={i.id}>
                      <NavLink
                        href={resolvedHref}
                        onClick={() => setOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-12 items-center gap-3 rounded-lg px-4 text-base font-medium transition-colors duration-200 ease-exit',
                          active
                            ? 'bg-accent text-accent-foreground'
                            : 'text-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <span aria-hidden className={cn('h-5 w-0.5 rounded-full transition-colors', active ? 'bg-primary' : 'bg-border')} />
                        <span className="flex-1">{i.title}</span>
                        <span aria-hidden className="text-xs tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

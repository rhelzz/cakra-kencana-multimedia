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
  // The header starts tall over the hero, then shrinks and earns a solid background
  // once you've scrolled past that first section. The hero is light (copy sits on the
  // background colour), so the top state uses foreground text — everywhere else it's
  // solid and compact from the start. The trigger is the viewport height, not a fixed
  // pixel count, because the hero is sized in svh.
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
        'fixed inset-x-0 top-0 z-50 text-foreground transition-colors duration-300 motion-reduce:transition-none',
        scrolled
          ? 'border-b border-border bg-background/80 backdrop-blur-md'
          : 'border-b border-transparent',
      )}
    >
      <nav
        className={cn(
          'mx-auto flex max-w-6xl items-center gap-3 px-4 transition-[height] duration-300 motion-reduce:transition-none sm:gap-6 sm:px-6',
          scrolled ? 'h-20' : 'h-24 md:h-32',
        )}
      >
        {/* The brand is always the logo image: large over the hero, shrinking to the
            compact bar size once scrolled — one <img> whose height animates, so the mark
            visibly draws itself smaller instead of cross-fading between two marks.
            alt="" keeps it decorative; aria-label on the link names the destination. */}
        <NavLink
          href={resolve('#top')}
          aria-label={siteName}
          className="flex min-w-0 flex-1 items-center sm:flex-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt=""
            className={cn(
              'w-auto transition-[height] duration-300 motion-reduce:transition-none',
              scrolled ? 'h-13' : 'h-16 md:h-20',
            )}
          />
        </NavLink>

        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {items.map((i) => {
            const href = resolve(i.href);
            const active = !i.href.startsWith('#') && (pathname === href || pathname.startsWith(`${href}/`));
            return (
            <li key={i.id}>
              <NavLink
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold tracking-[0.015em] transition-colors',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {i.title}
              </NavLink>
            </li>
            );
          })}
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          {/* Floating chip: over the hero the bar is transparent, so the two icon
              buttons ride on a blurred pill for legibility. Once scrolled the bar
              is solid glass itself, so the pill fades to nothing. Colour-only
              transition — backdrop-filter stays put, it can't be interpolated. */}
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-full border p-1 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-exit motion-reduce:transition-none',
              scrolled
                ? 'border-transparent bg-transparent shadow-none backdrop-blur-none'
                : 'border-border/60 bg-background/60 shadow-sm backdrop-blur-md',
            )}
          >
            <LanguageSwitcher locale={locale} />
            <ThemeToggle locale={locale} />
          </div>

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
                  const active =
                    !i.href.startsWith('#') &&
                    (pathname === resolvedHref || pathname.startsWith(`${resolvedHref}/`));
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

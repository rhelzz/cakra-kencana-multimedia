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
  locale,
}: {
  items: Item[];
  logo: string;
  locale: Locale;
}) {
  const ui = t(locale);
  const pathname = usePathname();
  const base = localePath(locale) === '/' ? '' : localePath(locale);
  // "#about" only resolves on the home page; from a detail page it has to go home first.
  const atHome = pathname === (base || '/');
  const resolve = (href: string) => (href.startsWith('#') && !atHome ? `${base}/${href}` : href);
  // The header floats over the hero image until you scroll, then it earns a solid background.
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-border bg-background/80 text-foreground backdrop-blur-md'
          : 'border-b border-transparent text-white',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        {/* The logo already carries the company name, so no wordmark beside it.
            The white plate keeps a dark, full-colour logo legible over the hero photo
            and in dark mode; drop it if a transparent white/mono logo is supplied. */}
        <NavLink href={resolve('#top')} className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt="Cakra Kencana Multimedia"
            className="h-10 w-auto rounded-md bg-white p-1"
          />
        </NavLink>

        <ul className="ml-auto hidden items-center gap-1 md:flex">
          {items.map((i) => (
            <li key={i.id}>
              <NavLink
                href={resolve(i.href)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  scrolled ? 'hover:bg-accent hover:text-accent-foreground' : 'hover:bg-white/10',
                )}
              >
                {i.title}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className={cn('flex items-center gap-1', 'md:ml-0 ml-auto')}>
          <LanguageSwitcher locale={locale} />
          <ThemeToggle locale={locale} />

          <Sheet open={open} onOpenChange={setOpen}>
            {/* Base UI (not Radix) is the primitive here, so composition uses `render`, not `asChild`. */}
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label={ui.menu} />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>{ui.menu}</SheetTitle>
              </SheetHeader>
              <Separator />
              <ul className="flex flex-col gap-1 px-4">
                {items.map((i) => (
                  <li key={i.id}>
                    <NavLink
                      href={resolve(i.href)}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-2.5 text-base font-medium hover:bg-accent hover:text-accent-foreground"
                    >
                      {i.title}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

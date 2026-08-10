'use client';

import { Check, Languages } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LOCALES, LOCALE_NAMES, localePath, t, type Locale } from '@/lib/i18n';

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={t(locale).language} />}
      >
        <Languages className="size-[1.15rem]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} render={<a href={hrefFor(pathname, l)} />}>
            <Check className={l === locale ? 'size-4 opacity-100' : 'size-4 opacity-0'} />
            {LOCALE_NAMES[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Keep the visitor on the same page when they switch language. The proxy hides the default
 * locale, so the current path may or may not carry a prefix — strip whatever is there first.
 */
function hrefFor(pathname: string, target: Locale) {
  const stripped = LOCALES.reduce(
    (path, l) => (path === `/${l}` ? '/' : path.replace(new RegExp(`^/${l}/`), '/')),
    pathname,
  );
  const base = localePath(target);
  if (stripped === '/') return base;
  return base === '/' ? stripped : `${base}${stripped}`;
}

import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'zh-HK', 'zh-CN', 'ja'],
    defaultLocale: 'en', // navigation.js controls Link href generation; middleware.js separately controls redirect behaviour
    localePrefix: 'always'
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

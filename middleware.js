import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/navigation';

export default createMiddleware(routing);

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(zh-HK|zh-CN|ja|en)/:path*']
};


import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
    locales: ['en', 'zh'],
    defaultLocale: 'zh'
});

const isMerchantRoute = createRouteMatcher(['/merchant(.*)']);

export default clerkMiddleware(async (auth, req) => {
    if (isMerchantRoute(req)) {
        await auth.protect();
        return;
    }

    // For non-merchant routes, run intl middleware
    return intlMiddleware(req);
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};


import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
    locales: ['en', 'ja', 'zh-CN', 'zh-HK'],
    defaultLocale: 'zh-HK'
});

// Only localized /merchant routes require authentication
const isProtectedRoute = createRouteMatcher([
    '/(en|ja|zh-CN|zh-HK)/merchant(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    // Protect merchant routes with Clerk
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // Apply intl middleware for all routes (including protected ones)
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


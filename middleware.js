
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    locales: ['en', 'ja', 'zh-CN', 'zh-HK'],
    defaultLocale: 'zh-HK'
});

// Only localized /merchant and /collection routes require authentication
const isProtectedRoute = createRouteMatcher([
    '/(.*)/merchant(.*)',
    '/(.*)/collection(.*)'
]);

// API routes should NOT be localized
const isApiRoute = createRouteMatcher([
    '/api(.*)'
]);

// Auth routes that should NOT be localized
const isAuthRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    // 1. API: Handle separately (No Intl)
    if (isApiRoute(req)) {
        if (req.nextUrl.pathname.startsWith('/api/collection')) {
            await auth.protect();
        }
        return NextResponse.next();
    }

    // 2. Auth Pages: Handle separately (No Intl needed usually, but can be skipped)
    if (isAuthRoute(req)) {
        return NextResponse.next();
    }

    // 3. Protected Pages: Enforce Auth
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // 4. Public Pages: Apply i18n
    return intlMiddleware(req);
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};

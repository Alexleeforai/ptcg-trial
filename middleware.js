
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    locales: ['en', 'ja', 'zh-CN', 'zh-HK'],
    defaultLocale: 'zh-HK'
});

// Only localized /merchant routes require authentication
const isProtectedRoute = createRouteMatcher([
    '/(en|ja|zh-CN|zh-HK)/merchant(.*)'
]);

// Auth routes that should NOT be localized
const isAuthRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    // Skip i18n for auth routes - let them stay at root level
    if (isAuthRoute(req)) {
        // Only apply Clerk protection, no i18n routing
        return NextResponse.next();
    }

    // Protect merchant routes with Clerk
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // Apply intl middleware for all non-auth routes
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



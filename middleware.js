

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
    locales: ['en', 'ja', 'zh-CN', 'zh-HK'],
    defaultLocale: 'en'
});

// Only /merchant routes require authentication
const isProtectedRoute = createRouteMatcher([
    '/merchant(.*)',
    '/(en|ja|zh-CN|zh-HK)/merchant(.*)'
]);

// Check if route is a localized auth route
const isLocalizedAuthRoute = createRouteMatcher([
    '/(en|ja|zh-CN|zh-HK)/sign-in(.*)',
    '/(en|ja|zh-CN|zh-HK)/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
    // Redirect localized auth routes to root level
    if (isLocalizedAuthRoute(req)) {
        const url = new URL(req.url);
        // Extract the auth path (e.g., /sign-in or /sign-up)
        const authPath = url.pathname.replace(/^\/(en|ja|zh-CN|zh-HK)/, '');
        return NextResponse.redirect(new URL(authPath + url.search, req.url));
    }

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

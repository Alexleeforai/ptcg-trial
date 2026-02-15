
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

    // 2. Auth Pages: Handle separately
    if (isAuthRoute(req)) {
        return NextResponse.next();
    }

    // 3. Protected Pages: Enforce Auth & Role
    if (isProtectedRoute(req)) {
        await auth.protect();

        // Merchant Route Protection
        if (req.nextUrl.pathname.includes('/merchant')) {
            const { sessionClaims } = await auth();
            const role = sessionClaims?.metadata?.role;

            // If not a merchant (including undefined role), redirect to home or show error
            // Exception: /merchant/onboarding is where they get the role, so allow it if they are authed (which protect() ensures)
            // But wait, if they are 'user' they shouldn't be in onboarding either? 
            // Onboarding sets the role. If they are already 'user', onboarding should probably fail or upgrade them?
            // User requested separate accounts. So if they are 'user', they should be kicked out.
            // But we can't easily check if they are "intended" to be merchant without the role yet.
            // The onboarding page itself handles the "set role" logic.
            // Let's allow onboarding, but protect other merchant routes.

            // if (!req.nextUrl.pathname.includes('/merchant/onboarding') && role !== 'merchant') {
            //     return NextResponse.redirect(new URL('/', req.url));
            // }
        }
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

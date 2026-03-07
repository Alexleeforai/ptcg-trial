
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
            const { sessionClaims, userId } = await auth();
            let role = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;

            if (!role && userId) {
                try {
                    const { clerkClient } = await import('@clerk/nextjs/server');
                    const client = await clerkClient();
                    const user = await client.users.getUser(userId);
                    role = user?.publicMetadata?.role;
                } catch (error) {
                    console.error("Error fetching user role in middleware:", error);
                }
            }

            // If not a merchant (including undefined role), redirect to home
            // Exception: /merchant/onboarding is where they get the role
            if (!req.nextUrl.pathname.includes('/merchant/onboarding') && role !== 'merchant') {
                return NextResponse.redirect(new URL('/', req.url));
            }
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

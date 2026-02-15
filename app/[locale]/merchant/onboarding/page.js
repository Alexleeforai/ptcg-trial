import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function MerchantOnboarding() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-up?type=merchant');
    }

    // Check if user already has a role
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Strict Separation: If already a user, prevent becoming merchant
    if (user.publicMetadata?.role === 'user') {
        // You might want to show an error page or redirect with error
        // For now, redirect to home with error query param? Or separate error page.
        // Or just redirect to / directory.
        // Actually, let's redirect to a dedicated error page or sign-out logic?
        // Clerk doesn't have easy "force sign out" on server like this?
        // Let's redirect to home for now.
        redirect('/?error=existing_user_cannot_be_merchant');
    }

    // Assign 'merchant' role to metadata
    await client.users.updateUserMetadata(userId, {
        publicMetadata: {
            role: 'merchant'
        }
    });

    // Redirect to merchant dashboard
    redirect('/merchant');
}

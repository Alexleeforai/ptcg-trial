'use client';

import { useState } from 'react';
import { SignUp } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';

export default function SignUpPage() {
    const searchParams = useSearchParams();
    // Allow pre-selecting tab via URL query ?type=merchant
    const initialType = searchParams.get('type') === 'merchant' ? 'merchant' : 'user';
    const [userType, setUserType] = useState(initialType);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' }}>
                Join Card Hero
            </h1>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                background: '#222',
                padding: '4px',
                borderRadius: '8px',
                marginBottom: '30px'
            }}>
                <button
                    onClick={() => setUserType('user')}
                    style={{
                        padding: '8px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        background: userType === 'user' ? '#3b82f6' : 'transparent',
                        color: userType === 'user' ? 'white' : '#888',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    User
                </button>
                <button
                    onClick={() => setUserType('merchant')}
                    style={{
                        padding: '8px 24px',
                        borderRadius: '6px',
                        border: 'none',
                        background: userType === 'merchant' ? '#3b82f6' : 'transparent',
                        color: userType === 'merchant' ? 'white' : '#888',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.2s'
                    }}
                >
                    Merchant
                </button>
            </div>

            {/* Clerk Sign Up Component */}
            <div style={{ width: '100%', maxWidth: '400px' }}>
                {userType === 'user' ? (
                    <div key="user-signup">
                        <p style={{ textAlign: 'center', marginBottom: '16px', color: '#888' }}>
                            Sign up to track your collection and compare prices.
                        </p>
                        <SignUp
                            // Regular users redirect to home or previous page
                            fallbackRedirectUrl="/"
                            signInUrl="/sign-in"
                        />
                    </div>
                ) : (
                    <div key="merchant-signup">
                        <p style={{ textAlign: 'center', marginBottom: '16px', color: '#888' }}>
                            Sign up to become a merchant and sell cards.
                        </p>
                        <SignUp
                            // Merchants redirect to onboarding to set role
                            fallbackRedirectUrl="/merchant/onboarding"
                            forceRedirectUrl="/merchant/onboarding"
                            signInUrl="/merchant/sign-in"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

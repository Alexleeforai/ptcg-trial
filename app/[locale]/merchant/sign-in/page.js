import { SignIn } from '@clerk/nextjs';

export default function MerchantSignInPage() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                Merchant Login
            </h1>
            <p style={{ color: '#888', marginBottom: '30px' }}>
                Access your shop dashboard
            </p>

            <SignIn
                fallbackRedirectUrl="/merchant"
                showSignUp={false} // Don't allow toggling to sign up here to avoid confusion, keep flow strict
            />

            <div style={{ marginTop: '20px', fontSize: '0.9rem' }}>
                <a href="/sign-up?type=merchant" style={{ color: '#3b82f6' }}>
                    Register as a new merchant
                </a>
            </div>
        </div>
    );
}


import { UserButton } from "@clerk/nextjs";

export default function MerchantDashboard() {
    return (
        <div style={{ padding: '40px', background: '#000', minHeight: '100vh', color: '#fff' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Merchant Portal</h1>
                <UserButton />
            </nav>

            <div style={{ border: '1px solid #333', padding: '20px', borderRadius: '8px' }}>
                <h2>Welcome, Merchant!</h2>
                <p style={{ color: '#888', marginTop: '10px' }}>
                    This is your dashboard. Once we connect the database, you will be able to manage your listings here.
                </p>

                <div style={{ marginTop: '20px' }}>
                    <button disabled style={{ padding: '10px 20px', background: '#333', color: '#888', border: 'none', borderRadius: '4px', cursor: 'not-allowed' }}>
                        Add Listing (Unavailable)
                    </button>
                </div>
            </div>
        </div>
    );
}

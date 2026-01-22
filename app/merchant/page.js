
import { getMerchantListings } from '@/app/actions/merchant';
import { UserButton } from "@clerk/nextjs";
import MerchantListingsTable from '@/components/merchant/MerchantListingsTable';
import AddListingButton from '@/components/merchant/AddListingButton';

export const dynamic = 'force-dynamic';

export default async function MerchantDashboard() {
    const listings = await getMerchantListings();

    return (
        <div style={{ padding: '20px 40px', background: '#111', minHeight: '100vh', color: '#fff' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Merchant Portal</h1>
                <UserButton />
            </nav>

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>My Listings</h2>
                        <p style={{ color: '#888' }}>You have {listings.length} active listings.</p>
                    </div>
                    <AddListingButton />
                </div>

                <MerchantListingsTable initialListings={listings} />
            </div>
        </div>
    );
}

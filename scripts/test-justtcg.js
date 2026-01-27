import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.JUSTTCG_API_KEY;
const BASE_URL = 'https://api.justtcg.com/v1';

async function testJustTCG() {
    console.log(`Testing JustTCG API with Key: ${API_KEY.slice(0, 8)}...`);

    // Try to search for set code
    const query = "sv4a";
    const url = `${BASE_URL}/cards?q=name:${encodeURIComponent(query)}&limit=5`;
    // Maybe query param should be generic 'q', not 'q=name:' if searching set?
    // Docs say 'q' is text search. 'q=name:...' is specific field.
    // Let's try generic query 'q=sv4a' first.
    const url2 = `${BASE_URL}/cards?q=${encodeURIComponent(query)}&limit=5`;

    try {
        const res = await fetch(url, {
            headers: {
                'x-api-key': API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error(`Body: ${text}`);
            return;
        }

        const data = await res.json();
        console.log("Success! Response data:");
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testJustTCG();

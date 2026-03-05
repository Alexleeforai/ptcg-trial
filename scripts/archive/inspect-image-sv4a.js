async function inspectSV4a() {
    const url = 'https://api.tcgdex.net/v2/ja/cards/sv4a-001';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Image Field:", data.image);
    } catch (e) { console.error(e); }
}
inspectSV4a();

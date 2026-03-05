async function testImageConn() {
    const urls = [
        'https://assets.tcgdex.net/ja/E4/031/high.webp',
        'https://assets.tcgdex.net/ja/E4/031/high.png',
        'https://assets.tcgdex.net/ja/e4/031/high.webp', // Lowercase set
        'https://assets.tcgdex.net/jp/E4/031/high.webp', // 'jp' instead of 'ja'
        'https://assets.tcgdex.net/ja/pcg/E4/031/high.webp' // extra path?
    ];

    for (const u of urls) {
        try {
            const res = await fetch(u, { method: 'HEAD' });
            console.log(`[${res.status}] ${u}`);
        } catch (e) {
            console.log(`[ERR] ${u} - ${e.message}`);
        }
    }
}

testImageConn();

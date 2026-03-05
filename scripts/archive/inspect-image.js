async function inspectImage() {
    const url = 'https://api.tcgdex.net/v2/ja/cards/E4-031';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Image Field:", data.image);

        // Also fetch Set E4 list
        const setUrl = 'https://api.tcgdex.net/v2/ja/sets/E4';
        const res2 = await fetch(setUrl);
        const data2 = await res2.json();
        console.log("Set E4 Card[0] Image:", data2.cards[0].image);

    } catch (e) {
        console.error(e);
    }
}
inspectImage();

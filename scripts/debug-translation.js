// Using global fetch


// Copying logic from lib/data.js
const TRANSLATION_DB = {
    'リザードン': { en: 'Charizard', cn: '噴火龍' },
    'ピカチュウ': { en: 'Pikachu', cn: '皮卡丘' },
    'ナンジャモ': { en: 'Iono', cn: '奇樹' }
};

function applyTranslation(item) {
    const nameJP = item.name;
    let nameEN = item.name;
    let nameCN = item.name;

    console.log(`[Debug] Processing: '${nameJP}' (Code: ${nameJP.charCodeAt(0)})`);

    for (const [key, trans] of Object.entries(TRANSLATION_DB)) {
        if (nameJP.includes(key)) {
            console.log(`[Debug] Match found for key: '${key}'`);
            nameEN = nameJP.replace(key, trans.en);
            nameCN = nameJP.replace(key, trans.cn);
            break;
        }
    }

    return {
        id: item.id,
        nameJP: nameJP,
        nameCN: nameCN === nameJP ? '' : nameCN,
        nameEN: nameEN === nameJP ? '' : nameEN,
    };
}

(async () => {
    try {
        // Search for Pikachu
        const res = await fetch('https://api.tcgdex.net/v2/ja/cards?name=ピカチュウ');
        const data = await res.json();

        if (Array.isArray(data)) {
            console.log(`Found ${data.length} results.`);
            // Check first 5
            data.slice(0, 5).forEach(item => {
                const result = applyTranslation(item);
                console.log("-----------------------------------------");
                console.log("Original:", item.name);
                console.log("Result CN:", result.nameCN || '(empty)');
                console.log("Result EN:", result.nameEN || '(empty)');
            });
        }
    } catch (e) {
        console.error(e);
    }
})();

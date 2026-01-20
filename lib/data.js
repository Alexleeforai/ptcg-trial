// Mock Data Service

/* Data Types (Conceptual)
 * Card: { id, name, set, number, purity, rarity, image, basePriceJPY }
 * Shop: { id, name, location, whatsapp, bio }
 * Listing: { id, cardId, shopId, price, type: 'buy'|'sell', condition: 'S'|'A'|'B', stock: 'instock'|'preorder'|'out', updatedAt }
 */

const CARDS = [
    {
        id: 'sv4a-350',
        name: 'Iono (SAR)',
        nameJP: 'ナンジャモ',
        nameCN: '奇樹',
        set: 'Shiny Treasure ex',
        number: '350/190',
        rarity: 'SAR',
        image: 'https://images.pokemontcg.io/sv4pt5/237_hires.png', // Placeholder (Paldean Fates Iono)
        basePriceJPY: 22000,
    },
    {
        id: 'sv3-134',
        name: 'Charizard ex (SAR)',
        nameJP: 'リザードンex',
        nameCN: '噴火龍 ex',
        set: 'Ruler of the Black Flame',
        number: '134/108',
        rarity: 'SAR',
        image: 'https://images.pokemontcg.io/sv3/223_hires.png',
        basePriceJPY: 18000,
    },
    {
        id: 'sv2a-151',
        name: 'Mew ex (SAR)',
        nameJP: 'ミュウex',
        nameCN: '曼施 ex',
        set: 'Pokemon 151',
        number: '205/165',
        rarity: 'SAR',
        image: 'https://images.pokemontcg.io/sv3pt5/151_hires.png',
        basePriceJPY: 8500,
    },
    {
        id: 'sv4k-001',
        name: 'Pidgeot ex',
        nameJP: 'ピジョットex',
        nameCN: '比哲特 ex',
        set: 'Ancient Roar',
        number: '001/066',
        rarity: 'RR',
        image: 'https://images.pokemontcg.io/sv3/164_hires.png',
        basePriceJPY: 200,
    },
    {
        id: 'sv2a-025',
        name: 'Pikachu (Master Ball)',
        nameJP: 'ピカチュウ',
        nameCN: '皮卡丘',
        set: 'Pokemon 151',
        number: '025/165',
        rarity: 'R',
        image: 'https://images.pokemontcg.io/sv3pt5/25_hires.png', // Placeholder
        basePriceJPY: 15000,
    }
];

const SHOPS = [
    { id: 'mk-01', name: 'Card Hero MK', location: 'Mong Kok', whatsapp: '85212345678' },
    { id: 'wc-02', name: 'Wanchai Card Center', location: 'Wan Chai', whatsapp: '85287654321' },
    { id: 'tsw-03', name: 'Tin Shui Wai TCG', location: 'Tin Shui Wai', whatsapp: '85211223344' },
    { id: 'sino-04', name: 'Sino Hobby', location: 'Mong Kok (Sino)', whatsapp: '85299887766' },
];

const LISTINGS = [
    // Iono Buy/Sell
    { id: 'l1', cardId: 'sv4a-350', shopId: 'mk-01', price: 900, type: 'buy', condition: 'S', updatedAt: new Date().toISOString() },
    { id: 'l2', cardId: 'sv4a-350', shopId: 'wc-02', price: 950, type: 'buy', condition: 'S', updatedAt: new Date().toISOString() },
    { id: 'l3', cardId: 'sv4a-350', shopId: 'tsw-03', price: 1200, type: 'sell', condition: 'S', stock: 'instock', updatedAt: new Date().toISOString() },

    // Charizard
    { id: 'l4', cardId: 'sv3-134', shopId: 'sino-04', price: 850, type: 'buy', condition: 'A', updatedAt: new Date().toISOString() },
    { id: 'l5', cardId: 'sv3-134', shopId: 'wc-02', price: 1100, type: 'sell', condition: 'S', stock: 'instock', updatedAt: new Date().toISOString() },

    // Pidgeot ex (buying scenario)
    { id: 'l6', cardId: 'sv4k-001', shopId: 'sino-04', price: 80, type: 'sell', condition: 'S', stock: 'instock', updatedAt: new Date().toISOString() },
    { id: 'l7', cardId: 'sv4k-001', shopId: 'mk-01', price: 100, type: 'sell', condition: 'S', stock: 'out', updatedAt: new Date().toISOString() },
];

const SETS = [
    { id: 'sv4a', name: 'Shiny Treasure ex', baseSet: 'SV4a', releaseDate: '2023-12-01', image: 'https://images.pokemontcg.io/sv4pt5/logo.png' },
    { id: 'sv4k', name: 'Ancient Roar', baseSet: 'SV4K', releaseDate: '2023-10-27', image: 'https://images.pokemontcg.io/sv4/logo.png' },
    { id: 'sv4m', name: 'Future Flash', baseSet: 'SV4M', releaseDate: '2023-10-27', image: 'https://images.pokemontcg.io/sv4/logo.png' },
    { id: 'sv3a', name: 'Raging Surf', baseSet: 'SV3a', releaseDate: '2023-09-22', image: 'https://images.pokemontcg.io/sv3pt5/logo.png' },
    { id: 'sv3', name: 'Ruler of the Black Flame', baseSet: 'SV3', releaseDate: '2023-07-28', image: 'https://images.pokemontcg.io/sv3/logo.png' },
    { id: 'sv2a', name: 'Pokemon 151', baseSet: 'SV2a', releaseDate: '2023-06-16', image: 'https://images.pokemontcg.io/sv3pt5/logo.png' },
];

// --- Helpers ---

export async function getLatestSets() {
    await new Promise(resolve => setTimeout(resolve, 300));
    return SETS.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
}

export async function getSetById(setId) {
    return SETS.find(s => s.id === setId);
}

// TCGdex API Integration
const BASE_URL = 'https://api.tcgdex.net/v2/ja';

// Translation Database (Japanese -> { en, cn })
const TRANSLATION_DB = {
    'リザードン': { en: 'Charizard', cn: '噴火龍' },
    'ピカチュウ': { en: 'Pikachu', cn: '皮卡丘' },
    'ミュウ': { en: 'Mew', cn: '夢幻' },
    'ルギア': { en: 'Lugia', cn: '洛奇亞' },
    'ナンジャモ': { en: 'Iono', cn: '奇樹' },
    'アルセウス': { en: 'Arceus', cn: '阿爾宙斯' },
    'ギラティナ': { en: 'Giratina', cn: '騎拉帝納' },
    'パルキア': { en: 'Palkia', cn: '帕路奇亞' },
    'ディアルガ': { en: 'Dialga', cn: '帝牙盧卡' },
    'レックウザ': { en: 'Rayquaza', cn: '烈空坐' },
    'ブラッキー': { en: 'Umbreon', cn: '月亮伊布' },
    'ミミッキュ': { en: 'Mimikyu', cn: '謎擬Q' },
    'イーブイ': { en: 'Eevee', cn: '伊布' },
    'サーナイト': { en: 'Gardevoir', cn: '沙奈朵' },
    'ゲンガー': { en: 'Gengar', cn: '耿鬼' }
};

// Reverse map for search (English/Chinese -> Japanese)
// Maps both "charizard" and "噴火龍" to "リザードン"
const REVERSE_SEARCH_MAP = Object.entries(TRANSLATION_DB).reduce((acc, [jp, { en, cn }]) => {
    if (en) acc[en.toLowerCase()] = jp;
    if (cn) acc[cn] = jp;
    return acc;
}, {});

// Helper to apply translation
function applyTranslation(item) {
    const nameJP = item.name;
    let nameEN = item.name;
    let nameCN = item.name;

    // Try to translate
    for (const [key, trans] of Object.entries(TRANSLATION_DB)) {
        if (nameJP.includes(key)) {
            nameEN = nameJP.replace(key, trans.en);
            nameCN = nameJP.replace(key, trans.cn);
            break;
        }
    }

    return {
        id: item.id,
        name: nameJP,
        nameJP: nameJP,
        nameCN: nameCN === nameJP ? '' : nameCN,
        nameEN: nameEN === nameJP ? '' : nameEN,
        set: item.set?.name || item.id.split('-')[0],
        number: item.localId,
        rarity: item.rarity || 'Common',
        image: item.image ? `${item.image}/high.png` : '/placeholder.png',
        basePriceJPY: 0
    };
}

export async function searchCards(query) {
    if (!query) return [];

    // 1. Search Mock Data first (Priority)
    const qLower = query.toLowerCase();
    const mockResults = CARDS.filter(c =>
        c.name.toLowerCase().includes(qLower) ||
        c.nameJP.includes(qLower) ||
        c.nameCN.includes(qLower) ||
        c.id.includes(qLower)
    );

    if (mockResults.length > 0) return mockResults;

    // 2. Transliterate English/Chinese to Japanese for Searching
    let searchTerm = query;
    // Check direct match in map (for Chinese mostly)
    if (REVERSE_SEARCH_MAP[query]) {
        searchTerm = REVERSE_SEARCH_MAP[query];
    }
    // Check lowercase match (for English mostly)
    else if (REVERSE_SEARCH_MAP[qLower]) {
        searchTerm = REVERSE_SEARCH_MAP[qLower];
    }

    // 3. Fetch from TCGdex API
    try {
        const res = await fetch(`${BASE_URL}/cards?name=${encodeURIComponent(searchTerm)}`, { cache: 'no-store' });
        if (!res.ok) return [];

        const data = await res.json();
        if (!Array.isArray(data)) return [];

        // Map TCGdex to our App Card Model
        return data.slice(0, 20).map(applyTranslation);

    } catch (e) {
        console.error("TCGdex Search Error:", e);
        return [];
    }
}

export async function getCardById(id) {
    // 1. Check Mock Data
    const mockCard = CARDS.find(c => c.id === id);
    if (mockCard) return mockCard;

    // 2. Fetch from TCGdex API
    try {
        const res = await fetch(`${BASE_URL}/cards/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;

        const item = await res.json();

        return applyTranslation({
            ...item,
            image: item.image // Helper expects base path
        });
    } catch (e) {
        console.error("TCGdex Fetch Error:", e);
        return null;
    }
}

export async function getListingsByCardId(cardId) {
    // For API cards, we probably have no listings initially.
    // Return empty or valid mock listings if ID matches mock logic
    const listings = LISTINGS.filter(l => l.cardId === cardId);
    // Expand listing with Shop info
    return listings.map(l => ({
        ...l,
        shop: SHOPS.find(s => s.id === l.shopId)
    })).sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
}


export async function getTrendData(cardId) {
    // Mock trend data
    return [
        { date: '1/1', price: 21000 },
        { date: '1/5', price: 21500 },
        { date: '1/10', price: 20000 },
        { date: '1/15', price: 21800 },
        { date: '1/20', price: 22000 },
    ];
}

// For Merchant Dashboard
export async function updateListing(listing) {
    // Mock update
    console.log("Updated listing:", listing);
    return true;
}

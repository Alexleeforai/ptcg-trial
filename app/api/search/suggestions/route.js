import { searchSnkrdunk } from '@/lib/snkrdunk';
import { findCards, upsertCards } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Chinese → English translation map for common Pokemon names
const TRANSLATION_MAP = {
    // Pokemon
    '噴火龍': 'Charizard', '皮卡丘': 'Pikachu', '夢幻': 'Mew', '超夢': 'Mewtwo',
    '伊布': 'Eevee', '月亮伊布': 'Umbreon', '太陽伊布': 'Espeon', '水伊布': 'Vaporeon',
    '雷伊布': 'Jolteon', '火伊布': 'Flareon', '冰伊布': 'Glaceon', '葉伊布': 'Leafeon',
    '仙子伊布': 'Sylveon', '耿鬼': 'Gengar', '洛奇亞': 'Lugia', '烈空坐': 'Rayquaza',
    '騎拉帝納': 'Giratina', '阿爾宙斯': 'Arceus', '帝牙盧卡': 'Dialga', '帕路奇亞': 'Palkia',
    '水箭龜': 'Blastoise', '妙蛙花': 'Venusaur', '暴鯉龍': 'Gyarados', '卡比獸': 'Snorlax',
    '拉普拉斯': 'Lapras', '胡地': 'Alakazam', '怪力': 'Machamp', '風速狗': 'Arcanine',
    '九尾': 'Ninetales', '快龍': 'Dragonite', '班基拉斯': 'Tyranitar',
    '沙奈朵': 'Gardevoir', '謎擬Q': 'Mimikyu', '路卡利歐': 'Lucario', '甲賀忍蛙': 'Greninja',
    '鯉魚王': 'Magikarp', '百變怪': 'Ditto',
    '急凍鳥': 'Articuno', '閃電鳥': 'Zapdos', '火焰鳥': 'Moltres',
    '時拉比': 'Celebi', '水君': 'Suicune', '炎帝': 'Entei', '雷公': 'Raikou',
    '拉帝亞斯': 'Latias', '拉帝歐斯': 'Latios', '固拉多': 'Groudon', '蓋歐卡': 'Kyogre',
    '密勒頓': 'Miraidon', '故勒頓': 'Koraidon',
    // Trainers
    '奇樹': 'Iono', '莉莉艾': 'Lillie', '瑪俐': 'Marnie', '竹蘭': 'Cynthia'
};

function translateQuery(query) {
    // Check if query matches any Chinese term
    for (const [cn, en] of Object.entries(TRANSLATION_MAP)) {
        if (query.includes(cn)) {
            return query.replace(cn, en);
        }
    }
    return query;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 1) {
        return NextResponse.json({ results: [] });
    }

    // Translate Chinese query to English if needed
    const translatedQuery = translateQuery(q);
    const searchQuery = translatedQuery !== q ? translatedQuery : q;

    if (translatedQuery !== q) {
        console.log(`Translated "${q}" to "${translatedQuery}"`);
    }

    // 1. Check DB first
    let dbResults = findCards(searchQuery);

    // 2. If no results in DB, scrape SNKRDUNK
    if (dbResults.length === 0) {
        console.log(`Cache miss for "${searchQuery}". Scraping SNKRDUNK...`);
        try {
            const scrapedResults = await searchSnkrdunk(searchQuery);
            if (scrapedResults.length > 0) {
                // 3. Save to DB
                upsertCards(scrapedResults);
                dbResults = scrapedResults;
            }
        } catch (e) {
            console.error("Scraping error:", e);
        }
    } else {
        console.log(`Cache hit for "${searchQuery}". Found ${dbResults.length} in DB.`);
    }

    // Sort by Price High -> Low
    dbResults.sort((a, b) => {
        return b.price - a.price;
    });

    const suggestions = dbResults.slice(0, 8).map(card => ({
        id: card.id,
        name: card.name,
        // Snkrdunk doesn't distinguish EN/CN/JP names clearly in list, so just reuse name
        nameJP: card.nameJP || card.name,
        nameCN: card.nameCN || '',
        nameEN: card.nameEN || '',
        image: card.image,
        set: card.set,
        number: card.number || '',
        price: card.price, // JPY
        link: card.link
    }));

    return NextResponse.json({ results: suggestions });
}

// Chinese → English translation map for common Pokemon names

const TRANSLATION_MAP = {
    // Pokemon
    '噴火龍': 'Charizard', '皮卡丘': 'Pikachu', '比卡超': 'Pikachu', '夢幻': 'Mew', '超夢': 'Mewtwo',
    '伊布': 'Eevee', '月亮伊布': 'Umbreon', '太陽伊布': 'Espeon', '水伊布': 'Vaporeon',
    '雷伊布': 'Jolteon', '火伊布': 'Flareon', '冰伊布': 'Glaceon', '葉伊布': 'Leafeon',
    '仙子伊布': 'Sylveon', '耿鬼': 'Gengar', '洛奇亞': 'Lugia', '烈空坐': 'Rayquaza',
    '騎拉帝納': 'Giratina', '阿爾宙斯': 'Arceus', '帝牙盧卡': 'Dialga', '帕路奇亞': 'Palkia',
    '水箭龜': 'Blastoise', '妙蛙花': 'Venusaur', '奇異種子': 'Bulbasaur', '妙蛙種子': 'Bulbasaur',
    '暴鯉龍': 'Gyarados', '卡比獸': 'Snorlax', '車厘龜': 'Squirtle', '傑尼龜': 'Squirtle',
    '拉普拉斯': 'Lapras', '胡地': 'Alakazam', '怪力': 'Machamp', '風速狗': 'Arcanine',
    '九尾': 'Ninetales', '快龍': 'Dragonite', '啟暴龍': 'Dragonite', '班基拉斯': 'Tyranitar',
    '沙奈朵': 'Gardevoir', '謎擬Q': 'Mimikyu', '路卡利歐': 'Lucario', '甲賀忍蛙': 'Greninja',
    '鯉魚王': 'Magikarp', '百變怪': 'Ditto',
    '急凍鳥': 'Articuno', '閃電鳥': 'Zapdos', '火焰鳥': 'Moltres',
    '時拉比': 'Celebi', '水君': 'Suicune', '炎帝': 'Entei', '雷公': 'Raikou',
    '拉帝亞斯': 'Latias', '拉帝歐斯': 'Latios', '固拉多': 'Groudon', '蓋歐卡': 'Kyogre',
    '密勒頓': 'Miraidon', '故勒頓': 'Koraidon',
    // Trainers
    '奇樹': 'Iono', '莉莉艾': 'Lillie', '瑪俐': 'Marnie', '竹蘭': 'Cynthia'
};

export function translateQuery(query) {
    const matches = new Set();
    const q = query.trim();

    if (!q) return query;

    // 1. Exact Match
    if (TRANSLATION_MAP[q]) {
        return TRANSLATION_MAP[q];
    }

    // 2. Partial Match via Keys
    // If user types "噴火" (Splashing Fire), they probably want "噴火龍" (Charizard)
    // If user types "火" (Fire), they might mean Charizard, Flareon, Moltres...
    for (const [cn, en] of Object.entries(TRANSLATION_MAP)) {
        if (cn.includes(q)) {
            matches.add(en);
        }
    }

    if (matches.size > 0) {
        // Return regex-style OR string: "Charizard|Flareon"
        return Array.from(matches).join('|');
    }

    return query;
}

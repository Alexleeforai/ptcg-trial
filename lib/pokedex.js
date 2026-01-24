// Comprehensive list of Pokemon names for categorization
// This helps distinguish "Pokemon" cards from "Trainer" or "Item" cards
// and groups variations (e.g. "Charizard VMAX" -> "Charizard")

export const POKEMON_NAMES = [
    "Bulbasaur", "Ivysaur", "Venusaur",
    "Charmander", "Charmeleon", "Charizard",
    "Squirtle", "Wartortle", "Blastoise",
    "Caterpie", "Metapod", "Butterfree",
    "Weedle", "Kakuna", "Beedrill",
    "Pidgey", "Pidgeotto", "Pidgeot",
    "Rattata", "Raticate",
    "Spearow", "Fearow",
    "Ekans", "Arbok",
    "Pikachu", "Raichu",
    "Sandshrew", "Sandslash",
    "Nidoran", "Nidorina", "Nidoqueen", "Nidorino", "Nidoking",
    "Clefairy", "Clefable",
    "Vulpix", "Ninetales",
    "Jigglypuff", "Wigglytuff",
    "Zubat", "Golbat",
    "Oddish", "Gloom", "Vileplume",
    "Paras", "Parasect",
    "Venonat", "Venomoth",
    "Diglett", "Dugtrio",
    "Meowth", "Persian",
    "Psyduck", "Golduck",
    "Mankey", "Primeape",
    "Growlithe", "Arcanine",
    "Poliwag", "Poliwhirl", "Poliwrath",
    "Abra", "Kadabra", "Alakazam",
    "Machop", "Machoke", "Machamp",
    "Bellsprout", "Weepinbell", "Victreebel",
    "Tentacool", "Tentacruel",
    "Geodude", "Graveler", "Golem",
    "Ponyta", "Rapidash",
    "Slowpoke", "Slowbro",
    "Magnemite", "Magneton",
    "Farfetch'd",
    "Doduo", "Dodrio",
    "Seel", "Dewgong",
    "Grimer", "Muk",
    "Shellder", "Cloyster",
    "Gastly", "Haunter", "Gengar",
    "Onix",
    "Drowzee", "Hypno",
    "Krabby", "Kingler",
    "Voltorb", "Electrode",
    "Exeggcute", "Exeggutor",
    "Cubone", "Marowak",
    "Hitmonlee", "Hitmonchan",
    "Lickitung",
    "Koffing", "Weezing",
    "Rhyhorn", "Rhydon",
    "Chansey",
    "Tangela",
    "Kangaskhan",
    "Horsea", "Seadra",
    "Goldeen", "Seaking",
    "Staryu", "Starmie",
    "Mr. Mime",
    "Scyther",
    "Jynx",
    "Electabuzz",
    "Magmar",
    "Pinsir",
    "Tauros",
    "Magikarp", "Gyarados",
    "Lapras",
    "Ditto",
    "Eevee", "Vaporeon", "Jolteon", "Flareon",
    "Porygon",
    "Omanyte", "Omastar",
    "Kabuto", "Kabutops",
    "Aerodactyl",
    "Snorlax",
    "Articuno", "Zapdos", "Moltres",
    "Dratini", "Dragonair", "Dragonite",
    "Mewtwo", "Mew",
    // Gen 2 (Selected Popular)
    "Chikorita", "Bayleef", "Meganium",
    "Cyndaquil", "Quilava", "Typhlosion",
    "Totodile", "Croconaw", "Feraligatr",
    "Togepi", "Togetic",
    "Natu", "Xatu",
    "Mareep", "Flaaffy", "Ampharos",
    "Marill", "Azumarill",
    "Sudowoodo",
    "Espeon", "Umbreon",
    "Murkrow",
    "Misdreavus",
    "Unown",
    "Wobbuffet",
    "Girafarig",
    "Pineco", "Forretress",
    "Dunsparce",
    "Gligar",
    "Steelix",
    "Snubbull", "Granbull",
    "Qwilfish",
    "Scizor",
    "Shuckle",
    "Heracross",
    "Sneasel",
    "Teddiursa", "Ursaring",
    "Slugma", "Magcargo",
    "Swinub", "Piloswine",
    "Corsola",
    "Remoraid", "Octillery",
    "Delibird",
    "Mantine",
    "Skarmory",
    "Houndour", "Houndoom",
    "Kingdra",
    "Phanpy", "Donphan",
    "Porygon2",
    "Stantler",
    "Smeargle",
    "Tyrogue", "Hitmontop",
    "Smoochum",
    "Elekid",
    "Magby",
    "Miltank",
    "Blissey",
    "Raikou", "Entei", "Suicune",
    "Larvitar", "Pupitar", "Tyranitar",
    "Lugia", "Ho-Oh",
    "Celebi",
    // Gen 3 (Selected Popular)
    "Treecko", "Grovyle", "Sceptile",
    "Torchic", "Combusken", "Blaziken",
    "Mudkip", "Marshtomp", "Swampert",
    "Ralts", "Kirlia", "Gardevoir",
    "Sableye", "Mawile",
    "Aron", "Lairon", "Aggron",
    "Meditite", "Medicham",
    "Plusle", "Minun",
    "Roselia",
    "Gulpin", "Swalot",
    "Carvanha", "Sharpedo",
    "Wailmer", "Wailord",
    "Numel", "Camerupt",
    "Torkoal",
    "Spoink", "Grumpig",
    "Spinda",
    "Trapinch", "Vibrava", "Flygon",
    "Cacnea", "Cacturne",
    "Swablu", "Altaria",
    "Zangoose", "Seviper",
    "Lunatone", "Solrock",
    "Barboach", "Whiscash",
    "Corphish", "Crawdaunt",
    "Baltoy", "Claydol",
    "Lileep", "Cradily",
    "Anorith", "Armaldo",
    "Feebas", "Milotic",
    "Castform",
    "Kecleon",
    "Shuppet", "Banette",
    "Duskull", "Dusclops",
    "Tropius",
    "Chimecho",
    "Absol",
    "Wynaut",
    "Snorunt", "Glalie",
    "Spheal", "Sealeo", "Walrein",
    "Clamperl", "Huntail", "Gorebyss",
    "Relicanth",
    "Luvdisc",
    "Bagon", "Shelgon", "Salamence",
    "Beldum", "Metang", "Metagross",
    "Regirock", "Regice", "Registeel",
    "Latias", "Latios",
    "Kyogre", "Groudon", "Rayquaza",
    "Jirachi", "Deoxys",
    // Gen 4 (Selected Popular)
    "Turtwig", "Grotle", "Torterra",
    "Chimchar", "Monferno", "Infernape",
    "Piplup", "Prinplup", "Empoleon",
    "Shinx", "Luxio", "Luxray",
    "Pachirisu",
    "Buizel", "Floatzel",
    "Cherubi", "Cherrim",
    "Shellos", "Gastrodon",
    "Ambipom",
    "Drifloon", "Drifblim",
    "Buneary", "Lopunny",
    "Mismagius",
    "Honchkrow",
    "Glameow", "Purugly",
    "Chingling",
    "Stunky", "Skuntank",
    "Bronzor", "Bronzong",
    "Bonsly", "Mime Jr.", "Happiny",
    "Chatot",
    "Spiritomb",
    "Gible", "Gabite", "Garchomp",
    "Munchlax",
    "Riolu", "Lucario",
    "Hippopotas", "Hippowdon",
    "Skorupi", "Drapion",
    "Croagunk", "Toxicroak",
    "Carnivine",
    "Finneon", "Lumineon",
    "Mantyke",
    "Snover", "Abomasnow",
    "Weavile",
    "Magnezone",
    "Lickilicky",
    "Rhyperior",
    "Tangrowth",
    "Electivire",
    "Magmortar",
    "Togekiss",
    "Yanmega",
    "Leafeon", "Glaceon",
    "Gliscor",
    "Mamoswine",
    "Porygon-Z",
    "Gallade",
    "Probopass",
    "Dusknoir",
    "Froslass",
    "Rotom",
    "Uxie", "Mesprit", "Azelf",
    "Dialga", "Palkia", "Heatran", "Regigigas", "Giratina", "Cresselia",
    "Phione", "Manaphy", "Darkrai", "Shaymin", "Arceus",
    // Gen 5 (Selected Popular)
    "Victini", "Snivy", "Tepig", "Oshawott", "Zorua", "Zoroark", "Minccino", "Cinccino",
    "Joltik", "Galvantula", "Ferroseed", "Ferrothorn", "Chandelure", "Haxorus", "Hydreigon", "Volcarona",
    "Cobalion", "Terrakion", "Virizion", "Tornadus", "Thundurus", "Reshiram", "Zekrom", "Landorus", "Kyurem", "Keldeo", "Meloetta", "Genesect",
    // Gen 6 (Selected Popular)
    "Chespin", "Fennekin", "Froakie", "Greninja", "Fletchling", "Talonflame", "Sylveon", "Hawlucha", "Dedenne", "Goomy", "Goodra", "Klefki",
    "Xerneas", "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion",
    // Gen 7 (Selected Popular)
    "Rowlet", "Decidueye", "Litten", "Incineroar", "Popplio", "Primarina", "Rockruff", "Lycanroc", "Mareanie", "Toxapex", "Mimikyu",
    "Tapu Koko", "Tapu Lele", "Tapu Bulu", "Tapu Fini", "Cosmog", "Solgaleo", "Lunala", "Nihilego", "Buzzwole", "Pheromosa", "Xurkitree", "Celesteela", "Kartana", "Guzzlord", "Necrozma", "Magearna", "Marshadow", "Poipole", "Naganadel", "Stakataka", "Blacephalon", "Zeraora", "Meltan", "Melmetal",
    // Gen 8 (Selected Popular)
    "Grookey", "Scorbunny", "Sobble", "Corviknight", "Wooloo", "Yamper", "Toxtricity", "Sizzlipede", "Centiskorch", "Hatterene", "Grimmsnarl", "Obstagoon", "Perrserker", "Cursola", "Sirfetch'd", "Mr. Rime", "Runerigus", "Milcery", "Alcremie", "Falinks", "Pincurchin", "Snom", "Frosmoth", "Stonjourner", "Eiscue", "Indeedee", "Morpeko", "Cufant", "Copperajah", "Dracozolt", "Arctozolt", "Dracovish", "Arctovish", "Duraludon", "Dreepy", "Drakloak", "Dragapult", "Zacian", "Zamazenta", "Eternatus", "Kubfu", "Urshifu", "Zarude", "Regieleki", "Regidrago", "Glastrier", "Spectrier", "Calyrex", "Wyrdeer", "Kleavor", "Ursaluna", "Basculegion", "Sneasler", "Overqwil", "Enamorus",
    // Gen 9 (Selected Popular)
    "Sprigatito", "Floragato", "Meowscarada",
    "Fuecoco", "Crocalor", "Skeledirge",
    "Quaxly", "Quaxwell", "Quaquaval",
    "Lechonk", "Pawmi", "Pawmo", "Pawmot",
    "Fidough", "Dachsbun", "Smoliv",
    "Charcadet", "Armarouge", "Ceruledge",
    "Tadbulb", "Bellibolt",
    "Wattrel", "Kilowattrel",
    "Maushold", "Ficough",
    "Grafaiai", "Nacli",
    "Glimmet", "Glimmora",
    "Greavard", "Houndstone",
    "Cetoddle", "Cetitan",
    "Tatsugiri", "Dondozo",
    "Great Tusk", "Scream Tail", "Brute Bonnet", "Flutter Mane", "Slither Wing", "Sandy Shocks",
    "Iron Treads", "Iron Bundle", "Iron Hands", "Iron Jugulis", "Iron Moth", "Iron Thorns",
    "Frigibax", "Arctibax", "Baxcalibur",
    "Gimmighoul", "Gholdengo",
    "Wo-Chien", "Chien-Pao", "Ting-Lu", "Chi-Yu",
    "Roaring Moon", "Iron Valiant",
    "Koraidon", "Miraidon",
    "Walking Wake", "Iron Leaves",
    "Dipplin", "Poltchageist", "Sinistcha", "Okidogi", "Munkidori", "Fezandipiti", "Ogerpon", "Archaludon", "Hydrapple", "Gouging Fire", "Raging Bolt", "Iron Boulder", "Iron Crown", "Terapagos", "Pecharunt"
];

// Helper to normalize card name for matching
// e.g. "Charizard ex" -> "charizard"
export function normalizePokemonName(name) {
    if (!name) return "";
    return name
        .toLowerCase()
        // Remove common suffixes
        .replace(/\s(v|vmax|vstar|ex|gx|break|level x|prime|star|radiant|shining|amazing rare)$/i, "")
        .replace(/^(radiant|shining|dark|light|rocket's|erika's|misty's|brock's|giovanni's|sabrina's|blaine's|lt\. surge's|koga's)\s/i, "")
        .trim();
}

export function getCategoryFromCard(card) {
    const name = card.name || "";
    const lowerName = name.toLowerCase();

    // Check ITEM keywords
    if (
        lowerName.includes("ball") ||
        lowerName.includes("potion") ||
        lowerName.includes("switch") ||
        lowerName.includes("devolution spray") ||
        lowerName.includes("escape rope") ||
        lowerName.includes("rare candy") ||
        lowerName.includes("energy retrieval") ||
        lowerName.includes("super rod") ||
        lowerName.includes("vs seeker") ||
        lowerName.includes("battle vip pass") ||
        lowerName.includes("nest ball") ||
        lowerName.includes("ultra ball") ||
        lowerName.includes("level ball") ||
        lowerName.includes("friend ball") ||
        lowerName.includes("lure module") ||
        lowerName.includes("capture aroma") ||
        lowerName.includes("prime catcher")
    ) {
        return "Items";
    }

    // Check Pokemon Names
    const normalized = normalizePokemonName(name);
    // Find matching pokemon in POKEMON_NAMES
    // We try to match: normalized starts with pokemon name? or is equal?
    const foundPokemon = POKEMON_NAMES.find(p => normalized === p.toLowerCase() || normalized.includes(p.toLowerCase()));

    if (foundPokemon) {
        return foundPokemon; // Return the canonical Pokemon name
    }

    // If not Item and not Pokemon, default to Trainer
    // (Most non-pokemon cards are Supporters / Trainers)
    if (
        lowerName.includes("research") ||
        lowerName.includes("orders") ||
        lowerName.includes("path") ||
        lowerName.includes("stadium") ||
        lowerName.includes("tool")
    ) {
        return "Trainers";
    }

    // Default catch-all for unrecognized: check if it's likely a trainer (human names)
    // For now, simplify: if not pokemon name found, treat as Trainer/Other
    return "Trainers";
}

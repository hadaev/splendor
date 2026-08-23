// ------------------------------------------------------
// COLORS
// ------------------------------------------------------
const COLORS = ["white", "blue", "green", "red", "black"];

// ------------------------------------------------------
// TIER 1 CARDS
// ------------------------------------------------------
const tier1 = [
    { id: "t1_1", tier: 1, color: "white", points: 0, cost: { blue: 1, green: 1, red: 1, black: 1 } },
    { id: "t1_2", tier: 1, color: "white", points: 0, cost: { blue: 2, green: 1, red: 1 } },
    { id: "t1_3", tier: 1, color: "white", points: 0, cost: { green: 3 } },
    { id: "t1_4", tier: 1, color: "white", points: 1, cost: { blue: 4 } },

    { id: "t1_5", tier: 1, color: "blue", points: 0, cost: { white: 1, green: 1, red: 1, black: 1 } },
    { id: "t1_6", tier: 1, color: "blue", points: 0, cost: { white: 2, green: 2 } },
    { id: "t1_7", tier: 1, color: "blue", points: 0, cost: { red: 3 } },
    { id: "t1_8", tier: 1, color: "blue", points: 1, cost: { green: 4 } },

    { id: "t1_9", tier: 1, color: "green", points: 0, cost: { white: 1, blue: 1, red: 1, black: 1 } },
    { id: "t1_10", tier: 1, color: "green", points: 0, cost: { white: 2, red: 2 } },
    { id: "t1_11", tier: 1, color: "green", points: 0, cost: { black: 3 } },
    { id: "t1_12", tier: 1, color: "green", points: 1, cost: { red: 4 } },

    { id: "t1_13", tier: 1, color: "red", points: 0, cost: { white: 1, blue: 1, green: 1, black: 1 } },
    { id: "t1_14", tier: 1, color: "red", points: 0, cost: { white: 2, black: 2 } },
    { id: "t1_15", tier: 1, color: "red", points: 0, cost: { blue: 3 } },
    { id: "t1_16", tier: 1, color: "red", points: 1, cost: { black: 4 } },

    { id: "t1_17", tier: 1, color: "black", points: 0, cost: { white: 1, blue: 1, green: 1, red: 1 } },
    { id: "t1_18", tier: 1, color: "black", points: 0, cost: { blue: 2, red: 2 } },
    { id: "t1_19", tier: 1, color: "black", points: 0, cost: { white: 3 } },
    { id: "t1_20", tier: 1, color: "black", points: 1, cost: { white: 4 } }
];

// ------------------------------------------------------
// TIER 2 CARDS
// ------------------------------------------------------
const tier2 = [
    { id: "t2_1", tier: 2, color: "white", points: 1, cost: { blue: 3, green: 2, red: 2 } },
    { id: "t2_2", tier: 2, color: "white", points: 2, cost: { blue: 5, black: 3 } },
    { id: "t2_3", tier: 2, color: "white", points: 2, cost: { green: 4, red: 2 } },

    { id: "t2_4", tier: 2, color: "blue", points: 1, cost: { white: 3, green: 2, black: 2 } },
    { id: "t2_5", tier: 2, color: "blue", points: 2, cost: { white: 5, red: 3 } },
    { id: "t2_6", tier: 2, color: "blue", points: 2, cost: { green: 4, black: 2 } },

    { id: "t2_7", tier: 2, color: "green", points: 1, cost: { white: 2, blue: 3, red: 2 } },
    { id: "t2_8", tier: 2, color: "green", points: 2, cost: { blue: 5, black: 3 } },
    { id: "t2_9", tier: 2, color: "green", points: 2, cost: { white: 4, red: 2 } },

    { id: "t2_10", tier: 2, color: "red", points: 1, cost: { white: 2, blue: 2, green: 3 } },
    { id: "t2_11", tier: 2, color: "red", points: 2, cost: { green: 5, black: 3 } },
    { id: "t2_12", tier: 2, color: "red", points: 2, cost: { white: 4, black: 2 } },

    { id: "t2_13", tier: 2, color: "black", points: 1, cost: { blue: 2, green: 2, red: 3 } },
    { id: "t2_14", tier: 2, color: "black", points: 2, cost: { white: 3, red: 5 } },
    { id: "t2_15", tier: 2, color: "black", points: 2, cost: { blue: 4, green: 2 } }
];

// ------------------------------------------------------
// TIER 3 CARDS
// ------------------------------------------------------
const tier3 = [
    { id: "t3_1", tier: 3, color: "white", points: 3, cost: { blue: 3, green: 3, red: 5, black: 3 } },
    { id: "t3_2", tier: 3, color: "white", points: 4, cost: { blue: 6, black: 3 } },

    { id: "t3_3", tier: 3, color: "blue", points: 3, cost: { white: 3, green: 5, red: 3, black: 3 } },
    { id: "t3_4", tier: 3, color: "blue", points: 4, cost: { white: 6, red: 3 } },

    { id: "t3_5", tier: 3, color: "green", points: 3, cost: { white: 3, blue: 3, red: 5, black: 3 } },
    { id: "t3_6", tier: 3, color: "green", points: 4, cost: { red: 6, black: 3 } },

    { id: "t3_7", tier: 3, color: "red", points: 3, cost: { white: 3, blue: 3, green: 5, black: 3 } },
    { id: "t3_8", tier: 3, color: "red", points: 4, cost: { green: 6, white: 3 } },

    { id: "t3_9", tier: 3, color: "black", points: 3, cost: { white: 3, blue: 3, green: 3, red: 5 } },
    { id: "t3_10", tier: 3, color: "black", points: 4, cost: { blue: 6, green: 3 } }
];

// ------------------------------------------------------
// NOBLES
// ------------------------------------------------------
const nobles = [
    { id: "n1", points: 3, cost: { white: 3, blue: 3, green: 3 } },
    { id: "n2", points: 3, cost: { red: 3, black: 3, white: 3 } },
    { id: "n3", points: 3, cost: { blue: 3, green: 3, red: 3 } },
    { id: "n4", points: 3, cost: { white: 4, black: 4 } },
    { id: "n5", points: 3, cost: { blue: 4, red: 4 } }
];
//requirement: { ruby: 3, emerald: 3, sapphire: 3 }
// ------------------------------------------------------
// INITIAL TOKENS
// ------------------------------------------------------
// Правила Splendor:
// - 2 игрока: по 4 жетона каждого базового цвета
// - 3 игрока: по 5
// - 4 игрока: по 7
// - золота (джокеров) всегда 5
function getInitialTokens(playersCount = 4) {
    const byPlayers = {
        2: 4,
        3: 5,
        4: 7
    };
    const base = byPlayers[playersCount] || 7;
    return {
        white: base,
        blue: base,
        green: base,
        red: base,
        black: base,
        gold: 5
    };
}

// Значение по умолчанию (4 игрока)
const initialTokens = getInitialTokens(4);

// ------------------------------------------------------
module.exports = {
    decks: {
        tier1,
        tier2,
        tier3
    },
    nobles,
    initialTokens,
    getInitialTokens
};

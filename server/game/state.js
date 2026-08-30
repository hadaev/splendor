// возможные цвета
const GEM_TYPES = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx', 'gold'];

function createEmptyPlayer(id, name) {
    return {
        id,
        name,
        tokens: {},          // { ruby: 1, emerald: 2, ... }
        bonuses: {},         // { ruby: 1, emerald: 3, ... } — купленные карты
        reservedCards: [],
        purchasedCards: [],
        claimedNobles: [],
        points: 0,
        isActive: false
    };
}

function createInitialGameState(gameId, decks, nobles, initialTokens, playerId) {
    console.log(gameId, decks, nobles, initialTokens, 'createInitialGameState');
    return {
        id: gameId, //roomId
        players: [],
        currentPlayerId: playerId,
        deckTier1: decks.tier1,
        deckTier2: decks.tier2,
        deckTier3: decks.tier3,
        visibleTier1: decks.tier1.slice(0, 4),
        visibleTier2: decks.tier2.slice(0, 4),
        visibleTier3: decks.tier3.slice(0, 4),
        nobles: nobles.slice(0, 3),
        deckNobles: nobles.slice(3),
        tokens: initialTokens,
        status: 'waiting',
        winnerId: null,
        deckTier1Count: decks.tier1.length,
        deckTier2Count: decks.tier2.length,
        deckTier3Count: decks.tier3.length,
    };
}

module.exports = {
    GEM_TYPES,
    createEmptyPlayer,
    createInitialGameState
};
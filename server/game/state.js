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

function gameState(
    gameId,

    deck1,
    deck2,
    deck3,

    openCards1,
    openCards2,
    openCards3,

    nobles,
    deckNobles,

    tokens,
    playerId
) {
    console.log(gameId, deck1, deck2, deck3, openCards1, openCards2, openCards3, nobles, initialTokens, 'createInitialGameState');
    return {
        id: gameId, //roomId
        players: [],
        currentPlayerId: playerId,
        deckTier1: deck1,
        deckTier2: deck2,
        deckTier3: deck3,
        visibleTier1: openCards1,
        visibleTier2: openCards2,
        visibleTier3: openCards3,
        nobles,
        deckNobles,
        tokens,
        status: 'waiting',
        winnerId: null,
        deckTier1Count: deck1.length,
        deckTier2Count: deck2.length,
        deckTier3Count: deck3.length,
    };
}

module.exports = {
    GEM_TYPES,
    createEmptyPlayer,
    gameState
};
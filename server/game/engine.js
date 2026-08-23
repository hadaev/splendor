const { GEM_TYPES } = require('./state');

// ------------------------------------------------------
// JOIN GAME (используется только при создании игры)
// ------------------------------------------------------
function joinGameLogic(game, playerName, createEmptyPlayer) {
    const playerId = 'p' + (game.players.length + 1);
    const newPlayer = createEmptyPlayer(playerId, playerName);

    const updatedGame = {
        ...game,
        players: [...game.players, newPlayer],
        currentPlayerId: game.currentPlayerId || playerId,
        status: 'in_progress'
    };

    return { updatedGame, playerId };
}

// ------------------------------------------------------
// MAIN MOVE ROUTER
// ------------------------------------------------------
function handleMove(game, playerId, move) {
    if (game.currentPlayerId !== playerId) {
        throw new Error('not_your_turn');
    }

    switch (move.type) {
        case 'take_tokens':
            return handleTakeTokens(game, playerId, move.tokens);

        case 'buy_card':
            return handleBuyCard(game, playerId, move.cardId);

        default:
            throw new Error('unknown_move');
    }
}

// ------------------------------------------------------
// TAKE TOKENS
// ------------------------------------------------------
function handleTakeTokens(game, playerId, tokensToTake) {
    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('player_not_found');

    const colors = Object.keys(tokensToTake);
    const count = colors.reduce((sum, c) => sum + tokensToTake[c], 0);

    // RULE: max 3 different OR 2 identical
    if (count > 3) throw new Error('too_many_tokens');

    const distinct = colors.length;

    // 2 identical rule
    if (distinct === 1) {
        const color = colors[0];
        if (tokensToTake[color] !== 2) throw new Error('invalid_double_take');
        if (game.tokens[color] < 4) throw new Error('not_enough_tokens_for_double');
    }

    // 3 different rule
    if (distinct === 3) {
        for (const c of colors) {
            if (tokensToTake[c] !== 1) throw new Error('invalid_three_take');
            if (game.tokens[c] < 1) throw new Error('not_enough_tokens');
        }
    }

    // RULE: player cannot exceed 10 tokens
    const playerTokenCount =
        Object.values(player.tokens).reduce((a, b) => a + b, 0) + count;

    if (playerTokenCount > 10) throw new Error('too_many_tokens_player');

    // APPLY CHANGES
    const newGame = { ...game };
    const newPlayer = { ...player, tokens: { ...player.tokens } };

    for (const c of colors) {
        newGame.tokens[c] -= tokensToTake[c];
        newPlayer.tokens[c] = (newPlayer.tokens[c] || 0) + tokensToTake[c];
    }

    // replace player
    newGame.players = newGame.players.map(p =>
        p.id === playerId ? newPlayer : p
    );

    // next turn
    newGame.currentPlayerId = getNextPlayerId(newGame, playerId);

    return newGame;
}

// ------------------------------------------------------
// BUY CARD
// ------------------------------------------------------
function handleBuyCard(game, playerId, cardId) {
    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('player_not_found');

    const card = findCardInGame(game, cardId);
    if (!card) throw new Error('card_not_found');

    // check affordability
    const missing = getMissingCost(player, card.cost);

    if (missing > player.tokens.gold) {
        throw new Error('cannot_afford');
    }

    // APPLY CHANGES
    const newGame = { ...game };
    const newPlayer = { ...player };

    // pay cost
    const newTokens = { ...newPlayer.tokens };

    for (const color of Object.keys(card.cost)) {
        const need = card.cost[color];
        const bonus = newPlayer.bonuses[color] || 0;
        const pay = Math.max(0, need - bonus);

        if (newTokens[color] >= pay) {
            newTokens[color] -= pay;
        } else {
            const deficit = pay - newTokens[color];
            newTokens[color] = 0;
            newTokens.gold -= deficit;
        }
    }

    newPlayer.tokens = newTokens;

    // add bonus
    newPlayer.bonuses = {
        ...newPlayer.bonuses,
        [card.color]: (newPlayer.bonuses[card.color] || 0) + 1
    };

    // add points
    newPlayer.points += card.points;

    // add purchased card
    newPlayer.purchasedCards = [...newPlayer.purchasedCards, card];

    // remove card from table + draw new one
    removeCardFromGame(newGame, card);

    // replace player
    newGame.players = newGame.players.map(p =>
        p.id === playerId ? newPlayer : p
    );

    // next turn
    newGame.currentPlayerId = getNextPlayerId(newGame, playerId);

    return newGame;
}

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------
function getNextPlayerId(game, currentId) {
    const idx = game.players.findIndex(p => p.id === currentId);
    const next = (idx + 1) % game.players.length;
    return game.players[next].id;
}

function findCardInGame(game, cardId) {
    const all = [
        ...game.visibleTier1,
        ...game.visibleTier2,
        ...game.visibleTier3
    ];
    return all.find(c => c.id === cardId);
}

function removeCardFromGame(game, card) {
    const tier = card.tier;

    const visibleKey = `visibleTier${tier}`;
    const deckKey = `deckTier${tier}`;
    const countKey = `deckTier${tier}Count`;

    // remove from visible
    game[visibleKey] = game[visibleKey].filter(c => c.id !== card.id);

    // draw new card
    if (game[deckKey].length > 0) {
        const newCard = game[deckKey][0];
        game[visibleKey].push(newCard);

        game[deckKey] = game[deckKey].slice(1);
        game[countKey]--;
    }
}

function getMissingCost(player, cost) {
    let missing = 0;

    for (const color of Object.keys(cost)) {
        const need = cost[color];
        const bonus = player.bonuses[color] || 0;
        const tokens = player.tokens[color] || 0;

        const pay = Math.max(0, need - bonus);
        if (tokens < pay) missing += pay - tokens;
    }

    return missing;
}

module.exports = {
    joinGameLogic,
    handleMove
};
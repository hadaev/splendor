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
    if (String(game.currentPlayerId) !== String(playerId)) {
        throw new Error('not_your_turn');
    }

    switch (move.type) {
        case 'take_tokens':
            return handleTakeTokens(game, playerId, move.tokens);

        case 'buy_card':
            return handleBuyCard(game, playerId, move.cardId);

        case 'buy_noble':
            return handleBuyNoble(game, playerId, move.nobleId);

        case 'reserve_card':
            return handleReserveCard(game, playerId, move.cardId);

        default:
            throw new Error('unknown_move');
    }
}

// ------------------------------------------------------
// TAKE TOKENS
// ------------------------------------------------------
function handleTakeTokens(game, playerId, tokensToTake) {
    const player = game.players.find(p => String(p.id) === String(playerId));
    if (!player) throw new Error('player_not_found');

    const colors = Object.keys(tokensToTake);
    const count = colors.reduce((sum, c) => sum + tokensToTake[c], 0);

    // RULE: max 3 different OR 2 identical
    if (count > 3) throw new Error('too_many_tokens');

    const distinct = colors.length;

    if (!((distinct === 1 && count === 2) || (distinct === 3 && count === 3))) {
        throw new Error('invalid_token_selection');
    }

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
    const newGame = { ...game, tokens: { ...game.tokens } };
    const newPlayer = { ...player, tokens: { ...player.tokens } };

    for (const c of colors) {
        newGame.tokens[c] -= tokensToTake[c];
        newPlayer.tokens[c] = (newPlayer.tokens[c] || 0) + tokensToTake[c];
    }

    // replace player
    newGame.players = newGame.players.map(p =>
        String(p.id) === String(playerId) ? newPlayer : p
    );

    const gameAfterNobles = applyQualifyingNobles(newGame, playerId);
    newGame.players = gameAfterNobles.players;
    newGame.nobles = gameAfterNobles.nobles;

    // next turn
    newGame.currentPlayerId = getNextPlayerId(newGame, playerId);

    return newGame;
}

// ------------------------------------------------------
// BUY CARD
// ------------------------------------------------------
function handleBuyCard(game, playerId, cardId) {
    const player = game.players.find(p => String(p.id) === String(playerId));
    if (!player) throw new Error('player_not_found');

    const reservedCard = (player.reservedCards || []).find(card => card.id === cardId);
    const card = reservedCard || findCardInGame(game, cardId);
    if (!card) throw new Error('card_not_found');

    // check affordability
    const missing = getMissingCost(player, card.cost);

    if (missing > (player.tokens.gold || 0)) {
        throw new Error('cannot_afford');
    }

    // APPLY CHANGES
    const newGame = { ...game, tokens: { ...game.tokens } };
    const newPlayer = { ...player };

    // pay cost
    const newTokens = { ...newPlayer.tokens };

    for (const color of Object.keys(card.cost)) {
        const need = card.cost[color];
        const bonus = newPlayer.bonuses[color] || 0;
        const pay = Math.max(0, need - bonus);

        const coloredTokensUsed = Math.min(newTokens[color] || 0, pay);
        const goldTokensUsed = pay - coloredTokensUsed;

        newTokens[color] = (newTokens[color] || 0) - coloredTokensUsed;
        newTokens.gold = (newTokens.gold || 0) - goldTokensUsed;
        newGame.tokens[color] = (newGame.tokens[color] || 0) + coloredTokensUsed;
        newGame.tokens.gold = (newGame.tokens.gold || 0) + goldTokensUsed;
    }

    newPlayer.tokens = newTokens;

    // add bonus
    newPlayer.bonuses = {
        ...newPlayer.bonuses,
        [card.bonus]: (newPlayer.bonuses[card.bonus] || 0) + 1
    };

    // add points
    newPlayer.points += card.points;

    // add purchased card
    newPlayer.purchasedCards = [...newPlayer.purchasedCards, card];

    if (reservedCard) {
        newPlayer.reservedCards = (newPlayer.reservedCards || []).filter(card => card.id !== cardId);
    } else {
        // Remove an open card from the table and draw a replacement.
        removeCardFromGame(newGame, card);
    }

    // replace player
    newGame.players = newGame.players.map(p =>
        String(p.id) === String(playerId) ? newPlayer : p
    );

    const gameAfterNobles = applyQualifyingNobles(newGame, playerId);
    newGame.players = gameAfterNobles.players;
    newGame.nobles = gameAfterNobles.nobles;

    // next turn
    newGame.currentPlayerId = getNextPlayerId(newGame, playerId);

    return newGame;
}


// ------------------------------------------------------
// RESERVE CARD
// ------------------------------------------------------
function handleReserveCard(game, playerId, cardId) {
    const player = game.players.find(p => String(p.id) === String(playerId));
    if (!player) throw new Error('player_not_found');

    const card = findCardInGame(game, cardId);
    if (!card) throw new Error('card_not_found');

    // rule: player can reserve up to 3 cards
    if ((player.reservedCards || []).length >= 3) {
        throw new Error('too_many_reserved');
    }

    const newGame = { ...game };
    const newPlayer = { ...player, reservedCards: [...(player.reservedCards || [])] };

    // give gold if available
    if (newGame.tokens.gold && newGame.tokens.gold > 0) {
        newPlayer.tokens = { ...(newPlayer.tokens || {}), gold: (newPlayer.tokens && newPlayer.tokens.gold) ? newPlayer.tokens.gold + 1 : 1 };
        newGame.tokens = { ...newGame.tokens, gold: newGame.tokens.gold - 1 };
    } else {
        newPlayer.tokens = { ...(newPlayer.tokens || {}) };
    }

    // move card to reserved
    newPlayer.reservedCards = [...newPlayer.reservedCards, card];

    // remove card from visible and draw replacement
    removeCardFromGame(newGame, card);

    // replace player
    newGame.players = newGame.players.map(p => String(p.id) === String(playerId) ? newPlayer : p);

    const gameAfterNobles = applyQualifyingNobles(newGame, playerId);
    newGame.players = gameAfterNobles.players;
    newGame.nobles = gameAfterNobles.nobles;

    // next turn
    newGame.currentPlayerId = getNextPlayerId(newGame, playerId);

    return newGame;
}

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------
function handleBuyNoble(game, playerId, nobleId) {
    const player = game.players.find(p => String(p.id) === String(playerId));
    if (!player) throw new Error('player_not_found');

    const noble = findNobleInGame(game, nobleId);
    if (!noble) throw new Error('noble_not_found');

    if (!canAffordNoble(player, noble.cost)) {
        throw new Error('cannot_afford_noble');
    }

    const newGame = { ...game };
    const newPlayer = {
        ...player,
        points: (player.points || 0) + (noble.points || 0),
        claimedNobles: [...(player.claimedNobles || [])]
    };

    newPlayer.claimedNobles = [...newPlayer.claimedNobles, noble];

    newGame.nobles = (newGame.nobles || []).filter(n => n.id !== nobleId);
    newGame.deckNobles = Array.isArray(newGame.deckNobles) ? [...newGame.deckNobles] : [];
    if (newGame.deckNobles.length > 0 && newGame.nobles.length < 3) {
        const replacement = newGame.deckNobles[0];
        newGame.nobles = [...newGame.nobles, replacement];
        newGame.deckNobles = newGame.deckNobles.slice(1);
    }
    newGame.players = newGame.players.map(p => String(p.id) === String(playerId) ? newPlayer : p);

    newGame.currentPlayerId = getNextPlayerId(newGame, playerId);

    return newGame;
}

function getNextPlayerId(game, currentId) {
    const idx = game.players.findIndex(p => String(p.id) === String(currentId));
    const next = (idx + 1) % game.players.length;
    return game.players[next].id;
}

function findCardInGame(game, cardId) {
    const all = [
        ...(game.openCards1 || []),
        ...(game.openCards2 || []),
        ...(game.openCards3 || [])
    ];
    return all.find(c => c.id === cardId);
}

function findNobleInGame(game, nobleId) {
    return (game.nobles || []).find(n => n.id === nobleId) || null;
}

function canAffordNoble(player, cost) {
    for (const [color, need] of Object.entries(cost || {})) {
        if ((player.bonuses[color] || 0) < need) {
            return false;
        }
    }
    return true;
}

function applyQualifyingNobles(game, playerId) {
    const player = game.players.find(p => String(p.id) === String(playerId));
    if (!player || !Array.isArray(game.nobles) || game.nobles.length === 0) {
        return game;
    }

    const eligibleNobles = game.nobles.filter(noble => canAffordNoble(player, noble.cost));
    if (eligibleNobles.length === 0) {
        return game;
    }

    const newPlayer = {
        ...player,
        points: (player.points || 0) + eligibleNobles.reduce((sum, noble) => sum + (noble.points || 0), 0),
        claimedNobles: [...(player.claimedNobles || []), ...eligibleNobles]
    };

    const updatedGame = {
        ...game,
        players: game.players.map(p => String(p.id) === String(playerId) ? newPlayer : p)
    };

    const remainingNobles = updatedGame.nobles.filter(noble => !eligibleNobles.some(item => item.id === noble.id));
    updatedGame.nobles = [...remainingNobles];
    updatedGame.deckNobles = Array.isArray(updatedGame.deckNobles) ? [...updatedGame.deckNobles] : [];

    while (updatedGame.nobles.length < 3 && updatedGame.deckNobles.length > 0) {
        const nextNoble = updatedGame.deckNobles[0];
        updatedGame.nobles.push(nextNoble);
        updatedGame.deckNobles = updatedGame.deckNobles.slice(1);
    }

    return updatedGame;
}

function removeCardFromGame(game, card) {
    const tier = card.tier;

    const visibleKey = `openCards${tier}`;
    const deckKey = `deck${tier}`;
    const countKey = `deck${tier}Count`;

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

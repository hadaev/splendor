import data from "../game/pabblesData.json";

// Перемешивание массива
function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

export function createInitialGameState(playersCount = 4) {
    // 1. Перемешиваем колоды
    const deck1 = shuffle(data.cardsLevel1);
    const deck2 = shuffle(data.cardsLevel2);
    const deck3 = shuffle(data.cardsLevel3);

    // 2. Выкладываем открытые карты (по 4)
    const openCards1 = deck1.slice(0, 4);
    const openCards2 = deck2.slice(0, 4);
    const openCards3 = deck3.slice(0, 4);

    // 3. Остатки в стопках
    const deck1Rest = deck1.slice(4);
    const deck2Rest = deck2.slice(4);
    const deck3Rest = deck3.slice(4);

    // 4. Благородные — случайные 3
    const nobles = shuffle(data.nobles).slice(0, 3);
    const deckNobles = data.nobles.length - 3;
    // 5. Фишки
    // Если задано распределение по числу игроков — используем его
    let tokens = { ...data.tokens };
    if (data.tokensByPlayers) {
        const key = String(Math.min(Math.max(playersCount, 2), 4));
        if (data.tokensByPlayers[key]) {
            tokens = { ...data.tokensByPlayers[key] };
        }
    }

    // 6. Игроки (пока пусто)
    const players = [];

    // 7. Собираем объект игры
    return {
        nobles,
        deckNobles: deckNobles,

        deck1: deck1Rest,
        deck2: deck2Rest,
        deck3: deck3Rest,

        openCards1,
        openCards2,
        openCards3,

        deck1Count: deck1Rest.length,
        deck2Count: deck2Rest.length,
        deck3Count: deck3Rest.length,

        tokens,

        players,

        turn: 0
    };
}

export function addPlayer(playerName, playerId, setGame) {
    setGame((prev) => {
        if (!prev) return prev;

        // ✅ Проверяем что игрока ещё нет
        if (prev.players.some(p => p.id === playerId)) {
            console.log('ℹ️ Игрок уже добавлен:', playerId);
            return prev;  // Не добавляем дубликат
        }

        const newPlayer = {
            id: playerId,
            name: playerName,
            points: 0,
            claimedNobles: [],
            tokens: {
                red: 0, blue: 0, green: 0, white: 0, black: 0, gold: 0
            },
            bonuses: {
                red: 0, blue: 0, green: 0, white: 0, black: 0
            }
        };

        console.log('✅ Добавлен игрок:', playerName, '(', playerId, ')');
        return {
            ...prev,
            players: [...prev.players, newPlayer]
        };
    });
};


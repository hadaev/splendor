import {makeAutoObservable} from "mobx";
import GameService from "../services/GameService";

export default class GameStore {
    game = null
    room = ''
    waitingForServerGame = false

    constructor() {
        makeAutoObservable(this);
        const savedGame = this.loadGame();
        if (savedGame) {
            this.game = savedGame;
            console.log('✅ Игра загружена из localStorage');
        }
    }

    saveGame = (game) => {
        try {
            if (!game) {
                localStorage.removeItem('splendor-game-state');
                console.log('🗑️ Игра удалена из localStorage');
                return;
            }
            localStorage.setItem('splendor-game-state', JSON.stringify(game));
            console.log('💾 Игра сохранена в localStorage, ID:', game.id);
        } catch (e) {
            console.warn('Failed to save game state', e);
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem('splendor-game-state');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn('Failed to load game state', e);
            return null;
        }
    }

    setGame = (game) =>{
        // Убираем возможные дубликаты игроков по id, чтобы предотвратить некорректное увеличение списка
        if (game && Array.isArray(game.players)) {
            const seen = new Set();
            const uniquePlayers = [];
            for (const p of game.players) {
                if (!seen.has(p.id)) {
                    seen.add(p.id);
                    uniquePlayers.push(p);
                }
            }
            if (uniquePlayers.length !== game.players.length) {
                console.log('⚠️ Удалены дубликаты игроков при установке состояния игры');
                game = { ...game, players: uniquePlayers };
            }
        }

        this.game = game
        this.saveGame(game)  // ✅ Сохраняем при каждом обновлении
    }

    setRoom(room) {
        this.room = room
        // try {
        //     if (!room) {
        //         localStorage.removeItem('splendor-room');
        //         return;
        //     }
        //     localStorage.setItem('splendor-room', JSON.stringify(room));
        // } catch (e) {
        //     console.warn('Failed to save room state', e);
        // }
    }

    // The server is the only source of active game state. A local fallback
    // would shuffle a different board for each player.
    async initGame(client, roomId) {
        this.waitingForServerGame = false;
        if (!client || !roomId) return null;

        this.waitingForServerGame = true;
        return new Promise((resolve) => {
            let completed = false;
            let timeoutId;
            let remove = () => {};
            const finish = (game = null) => {
                if (completed) return;
                completed = true;
                clearTimeout(timeoutId);
                remove();
                this.waitingForServerGame = false;
                resolve(game);
            };

            remove = client.addListener((msg) => {
                if (msg?.type === 'game_state' && msg.game && String(msg.game.id) === String(roomId)) {
                    this.setGame(msg.game);
                    finish(msg.game);
                }
            });

            try {
                client.send({ type: 'request_game_state', roomId });
            } catch (e) {
                finish();
                return;
            }

            timeoutId = setTimeout(finish, 3000);
        });
    };


    async onCreateRoom(name) {
        console.log('UserStore', name);
        try {
            const response = await GameService.onCreateRoom(name);
            localStorage.setItem('roomToken', response.data.room.roomToken);
            this.setRoom(response.data.room);
            return response.data.room;
        } catch (e) {
            return {
                error: true,
                message: e.response?.data?.message || 'Unable to create the room'
            };
        }
    }

    takeTokens(playerId, colors) {
        if (!this.game) return;

        const tokens = this.game.tokens;
        const player = this.game.players.find(p => p.id === playerId);
        if (!player) return;

        const unique = new Set(colors);

        // 3 разных цвета
        if (colors.length === 3 && unique.size === 3) {
            for (const color of colors) {
                if (tokens[color] <= 0) return;
            }
            for (const color of colors) {
                tokens[color] -= 1;
                player.tokens[color] += 1;
            }
        }

        // 2 одинаковых цвета
        else if (colors.length === 2 && unique.size === 1) {
            const color = colors[0];
            if (tokens[color] < 4) return;
            tokens[color] -= 2;
            player.tokens[color] += 2;
        }
    }
}

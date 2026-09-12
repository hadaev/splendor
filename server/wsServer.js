require('dotenv').config();
const { WebSocketServer, WebSocket } = require('ws');
const sequelize = require('./db/db');
const { createInitialGame } = require('./game/createInitialGameState');
const { handleMove } = require('./game/engine');
const userService = require('./utils/userService');
const gameService = require('./services/gameService');
const { Room } = require("./models/models");
const PORT = 8080
const wss = new WebSocketServer({ port: PORT });
const games = new Map();    // gameId -> gameState
// clients map unified into gameService.clients (single source of truth)
const rooms = new Map();    // roomId -> { players: Map(playerId -> name), status }

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------
function send(ws, msg) {
    ws.send(JSON.stringify(msg));
}

async function syncRoomsFromDb() {
    try {
        const dbRooms = await Room.findAll();
        for (const dbRoom of dbRooms) {
            const roomId = dbRoom.id;
            if (!rooms.has(roomId)) {
                rooms.set(roomId, {
                    players: new Map(),
                    status: 'waiting',
                    name: dbRoom.name,
                    currentPlayerId: null
                });
            } else {
                const existing = rooms.get(roomId);
                normalizeRoom(existing);
                if (!existing.name) {
                    existing.name = dbRoom.name;
                }
            }
        }
    } catch (e) {
        console.error('Failed to sync rooms from DB in WS server:', e);
    }
}

function normalizeRoom(room) {
    if (!room) return room;
    if (!(room.players instanceof Map)) {
        const rawPlayers = room.players && typeof room.players === 'object'
            ? room.players
            : {};
        const playerMap = new Map();
        if (Array.isArray(rawPlayers)) {
            rawPlayers.forEach((player) => {
                if (player && player.id !== undefined) {
                    playerMap.set(player.id, player.name || player.id);
                }
            });
        } else if (rawPlayers && typeof rawPlayers === 'object') {
            Object.entries(rawPlayers).forEach(([playerId, playerName]) => {
                playerMap.set(playerId, playerName || playerId);
            });
        }
        room.players = playerMap;
    }
    room.playerCount = room.players ? room.players.size : 0;
    return room;
}

function getRoomsList() {
    return Array.from(rooms.entries()).map(([roomId, room]) => {
        const normalized = normalizeRoom(room);
        return {
            roomId,
            name: normalized.name || `Комната #${roomId}`,
            players: normalized.players ? normalized.players.size : 0,
            maxPlayers: 4,
            status: normalized.status || 'waiting'
        };
    });
}

function broadcastRoomsList() {
    const message = JSON.stringify({ type: 'rooms_list', rooms: getRoomsList() });
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) client.send(message);
    }
}

function broadcastGame(roomId) {
    const game = games.get(roomId);
    if (!game) {
        console.warn(`⚠️ broadcastGame: game not found for roomId ${roomId}`);
        return;
    }

    let sentCount = 0;
    for (const [ws, info] of gameService.clients.entries()) {
        if (info.roomId === roomId) {
            send(ws, { type: 'game_state', game });
            sentCount++;
        }
    }
    console.log(`✅ broadcastGame: отправлена игра ${roomId} для ${sentCount} клиентов`);
}

// function broadcastRoomInfo(roomId,playerId) {
//     const room = rooms.get(roomId);
//
//     if (!room) return;
//
//     const info = {
//         type: "room_info",
//         roomId,
//         players: Array.from(room.players.entries()).map(([id, name]) => ({
//             id,
//             name
//         })),
//         status: room.status,
//         currentPlayerId: playerId
//     };
//     console.log('room_info = ', info);
//     for (const [ws, client] of clients.entries()) {
//         if (client.roomId === roomId) {
//             send(ws, info);
//         }
//     }
// }

// (getOrCreateRoom moved to gameService) - local helper removed to avoid duplication

// ------------------------------------------------------
// CONNECTION
// ------------------------------------------------------
wss.on('connection', (ws) => {

    ws.on('message', async (data) => {

        let msg;
        try {
            msg = JSON.parse(data.toString());
        } catch {
            send(ws, { type: 'error', message: 'invalid_json' });
            return;
        }
        console.log('data=',msg);
        // ------------------------------------------------------
        // AUTH
        // ------------------------------------------------------
        if (msg.type === 'auth') {
            userService.auth(ws, msg)
        }

        // ------------------------------------------------------
        // LIST ROOMS
        // ------------------------------------------------------
        if (msg.type === 'list_rooms') {
            await syncRoomsFromDb();
            send(ws, {
                type: 'rooms_list',
                rooms: getRoomsList()
            });

            return;
        }

        // ------------------------------------------------------
        // REQUEST GAME STATE
        // ------------------------------------------------------
        if (msg.type === 'request_game_state') {
            const roomId = typeof msg.roomId === 'string' && /^\d+$/.test(msg.roomId)
                ? Number(msg.roomId)
                : msg.roomId;

            const game = games.get(roomId);
            if (game) {
                send(ws, { type: 'game_state', game });
            } else {
                send(ws, { type: 'error', message: 'game_not_found', roomId });
            }
            return;
        }

        // ------------------------------------------------------
        // CREATE ROOM
        // ------------------------------------------------------
        if (msg.type === 'create_room') {
            const roomId = typeof msg.roomId === 'string' && /^\d+$/.test(msg.roomId)
                ? Number(msg.roomId)
                : msg.roomId;
            const currentPlayerId = msg.currentPlayerId;

            if (!roomId || !currentPlayerId) {
                send(ws, { type: 'error', message: 'room_id_and_player_id_required' });
                return;
            }

            if (rooms.has(roomId)) {
                const existingRoom = rooms.get(roomId);
                if (existingRoom && existingRoom.players && existingRoom.players.size > 0) {
                    send(ws, { type: 'error', message: 'room_already_exists' });
                    return;
                }
            }

            gameService.getOrCreateRoom(roomId, currentPlayerId, rooms, msg.roomName);

            const createdRoom = rooms.get(roomId);

            // Инициализируем начальную доску при создании комнаты, чтобы
            // все последующие подключающиеся видели одинаковые открытые карты
            // (создаём игру только если её ещё нет)
            if (!games.has(roomId)) {
                try {
                    // Можно использовать 4 игроков как стандартный шаблон при создании
                    const initialGame = createInitialGame(roomId, 4);
                    games.set(roomId, initialGame);
                    console.log(`💡 Инициализирована стартовая доска для комнаты ${roomId}`);
                } catch (e) {
                    console.error('Failed to create initial game on room creation', e);
                }
            }

            send(ws, {
                type: 'room_created',
                roomId,
                name: createdRoom && createdRoom.name ? createdRoom.name : String(roomId)
            });
            broadcastRoomsList();

            return;
        }

        // ------------------------------------------------------
        // JOIN ROOM
        // ------------------------------------------------------
        if (msg.type === 'join_game') {
            const gameId = typeof msg.gameId === 'string' && /^\d+$/.test(msg.gameId)
                ? Number(msg.gameId)
                : msg.gameId;

            if (!gameId || !msg.playerId || !msg.playerName) {
                send(ws, {
                    type: 'error',
                    message: 'join_game_requires_game_id_player_id_and_name',
                    gameId,
                    playerId: msg.playerId,
                    playerName: msg.playerName
                });
                return;
            }

            gameService.joinGame(ws, msg, rooms);

            // Если для комнаты уже есть игра — сразу отправим её подключившемуся клиенту
            const existingGame = games.get(gameId);
            if (existingGame) {
                send(ws, { type: 'game_state', game: existingGame });
            }

            broadcastRoomsList();
            return;
        }

        // ------------------------------------------------------
        // LEAVE ROOM
        // ------------------------------------------------------
        if (msg.type === 'leave_game') {
            const result = gameService.leaveGame(ws, msg, rooms);
            if (result && result.roomEmpty) {
                rooms.delete(result.roomId);
                games.delete(result.roomId);
            }
            broadcastRoomsList();
            return;
        }

        // ------------------------------------------------------
        // MAKE MOVE
        // ------------------------------------------------------
        if (msg.type === 'make_move') {
            try {
                const gameId = typeof msg.gameId === 'string' && /^\d+$/.test(msg.gameId)
                    ? Number(msg.gameId)
                    : msg.gameId;
                const { playerId, move } = msg;
                const game = games.get(gameId);
                if (!game) {
                    send(ws, { type: 'error', message: 'game_not_found' });
                    return;
                }
                const updatedGame = handleMove(game, playerId, move);
                games.set(gameId, updatedGame);
                // broadcast updated state to players in room
                gameService.broadcastRoomInfo(gameId, playerId, rooms);
                broadcastGame(gameId);
            } catch (e) {
                console.error('make_move error', e && e.message ? e.message : e);
                send(ws, { type: 'error', message: e && e.message ? e.message : 'move_error' });
            }
            return;
        }

        // ------------------------------------------------------
        // START GAME
        // ------------------------------------------------------
        if (msg.type === 'start_game') {
            const gameId = typeof msg.gameId === 'string' && /^\d+$/.test(msg.gameId)
                ? Number(msg.gameId)
                : msg.gameId;
            const {playerId} = msg;

            const room = rooms.get(gameId);
            if (!room) {
                console.error(`❌ start_game: Комната ${gameId} не найдена`);
                send(ws, { type: 'error', message: 'room_not_found' });
                return;
            }

            console.log(`🎮 START_GAME: gameId=${gameId}, playerId=${playerId}`);

            room.status = "running";
            const roomForCount = rooms.get(gameId);
            const playersCount = roomForCount && roomForCount.players ? roomForCount.players.size : 4;
            console.log(`👥 Игроков в комнате: ${playersCount}`);

            // Если игра уже создана при создании комнаты — не пересоздаём её,
            // используем существующую. Иначе создаём игровое состояние сейчас.
            if (!games.has(gameId)) {
                const game = createInitialGame(gameId, playersCount);
                console.log(`✅ Игра создана. Players: ${game.players?.length || 0}, Game ID: ${game.id}`);
                games.set(gameId, game);
                console.log(`💾 Игра сохранена в games Map для ID=${gameId}`);
            } else {
                console.log(`ℹ️ Игра для комнаты ${gameId} уже инициализирована ранее`);
            }

            gameService.broadcastRoomInfo(gameId, playerId, rooms);
            broadcastGame(gameId);  // ← ОТПРАВЛЯЕМ ИГРУ ВСЕМ КЛИЕНТАМ (включая тех, кто только что присоединились)
        }
    });

    // ------------------------------------------------------
    // CLOSE CONNECTION
    // ------------------------------------------------------
        ws.on('close', () => {
        const client = gameService.clients.get(ws);

        if (!client) return;

        const { playerId, roomId } = client;

        if (roomId && rooms.has(roomId)) {
            const room = normalizeRoom(rooms.get(roomId));
            if (playerId && room.players && room.players.has(playerId)) {
                room.players.delete(playerId);
                room.playerCount = room.players.size;
            }

            if (!room.players || room.players.size === 0) {
                rooms.delete(roomId);
                games.delete(roomId);
            }

            broadcastRoomsList();
        }

        gameService.clients.delete(ws);
    });
});

(async () => {
    try {
        await sequelize.authenticate();
        await syncRoomsFromDb();
        console.log('WS server DB connected and rooms synced.');
    } catch (e) {
        console.error('WS server DB sync error:', e);
    }
})();
console.log('WS server listening on ws://localhost:8080');

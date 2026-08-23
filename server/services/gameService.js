const userService = require('../utils/userService');
const {User, Room} = require("../models/models");
const bcrypt = require("bcrypt");

const clients = new Map();
class GameService {
    async createRoom(name){
        const normalizedName = typeof name === 'string' ? name.trim() : '';

        if (!normalizedName) {
            return { error: 'Room name is required', status: 400 };
        }

        if (normalizedName.length > 40) {
            return { error: 'Room name must not exceed 40 characters', status: 400 };
        }

        const existingRoom = await Room.findOne({ where: { name: normalizedName } });
        if (existingRoom) {
            return { error: 'A room with this name already exists', status: 409 };
        }

        const roomToken = await bcrypt.hash(normalizedName, 3);
        const dataRoom = await Room.create({
            name: normalizedName,
            roomToken
        });

        return {
            room: {
                id: dataRoom.id,
                name: dataRoom.name,
                roomToken: dataRoom.roomToken
            }
        };
    }

    async getRooms() {
        const dbRooms = await Room.findAll();
        return dbRooms.map(r => ({
            roomId: r.id,
            name: r.name,
            players: 0,
            maxPlayers: 4,
            status: 'waiting'
        }));
    }

    getOrCreateRoom(roomId, currentPlayerId, rooms, name = String(roomId)) {
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                players: new Map(), // playerId -> name
                status: 'waiting',
                currentPlayerId,
                name
            });
        }
        return rooms.get(roomId);
    }
    broadcastRoomInfo(roomId,playerId, rooms) {
        console.log('rooms = ', rooms);
        const room = rooms.get(roomId);

        if (!room) return;
        const players = Array.from(room.players.entries()).map(([id, name]) => ({ id, name }));
        const info = {
            type: "room_info",
            roomId,
            name: room.name,
            players: players,
            status: room.status,
            currentPlayerId: room.currentPlayerId
        };

        // console.log('room_info = ', info);
        for (const [ws, client] of clients.entries()) {
            if (client.roomId === roomId) {
                userService.send(ws, info);
            }
        }
    }

    joinGame(ws, msg, rooms){
        const gameId = typeof msg.gameId === 'string' && /^\d+$/.test(msg.gameId)
            ? Number(msg.gameId)
            : msg.gameId;
        const { playerName } = msg;
        // const client = clients.get(ws);
        // console.log(msg);
        let playerId = msg.playerId;

        // Требуем авторизацию: и идентификатор, и имя должны быть заданы
        if (!playerId || !playerName) {
            userService.send(ws, { type: 'unauthorized', message: 'auth_required' });
            return;
        }

        const room = this.getOrCreateRoom(gameId, playerId, rooms);

        // Ограничение 4 игрока
        if (room.players.size >= 4) {
            userService.send(ws, { type: 'room_full', roomId: gameId });
            return;
        }


        // Если игрок уже был в комнате — НЕ создаём нового

        if (!room.players.has(playerId)) {
            room.players.set(playerId, playerName);
        }

        // Обновляем client
        clients.set(ws, { playerId, roomId: gameId, name: playerName });

        userService.send(ws, { type: 'joined', gameId, playerId, currentPlayerId: playerId });

        this.broadcastRoomInfo(gameId, playerId, rooms);
        return;
    }
}

module.exports = new GameService();

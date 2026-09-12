// Game service: предоставляет функции управления комнатами и карту клиентов.
const bcrypt = require('bcrypt');
const { Room } = require('../models/models');
const userService = require('../utils/userService');

class GameService {
	constructor() {
		this.clients = new Map();
	}

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
		const room = rooms.get(roomId);
		if (!(room.players instanceof Map)) {
			const fallbackPlayers = room.players && typeof room.players === 'object'
				? new Map(Object.entries(room.players))
				: new Map();
			room.players = fallbackPlayers;
		}
		room.playerCount = room.players.size;
		return room;
	}

	broadcastRoomInfo(roomId, playerId, rooms) {
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
		for (const [ws, client] of this.clients.entries()) {
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
		let playerId = msg.playerId;
		if (!playerId || !playerName) {
			userService.send(ws, { type: 'unauthorized', message: 'auth_required' });
			return;
		}
		const room = this.getOrCreateRoom(gameId, playerId, rooms);
		if (room.players.size >= 4) {
			userService.send(ws, { type: 'room_full', roomId: gameId });
			return;
		}
		if (!(room.players instanceof Map)) {
			room.players = new Map(Object.entries(room.players || {}));
		}
		if (!room.players.has(playerId)) {
			room.players.set(playerId, playerName);
		}
		room.playerCount = room.players.size;
		this.clients.set(ws, { playerId, roomId: gameId, name: playerName });
		userService.send(ws, { type: 'joined', gameId, playerId, currentPlayerId: playerId });
		this.broadcastRoomInfo(gameId, playerId, rooms);
		return;
	}

	leaveGame(ws, msg, rooms) {
		const gameId = typeof msg.gameId === 'string' && /^\d+$/.test(msg.gameId)
			? Number(msg.gameId)
			: msg.gameId;
		const { playerId } = msg;
		if (!gameId || !playerId) {
			userService.send(ws, { type: 'error', message: 'game_id_and_player_id_required' });
			return { roomEmpty: false, roomId: gameId };
		}
		const room = rooms.get(gameId);
		if (!room) {
			userService.send(ws, { type: 'error', message: 'room_not_found' });
			return { roomEmpty: false, roomId: gameId };
		}
		if (!(room.players instanceof Map)) {
			room.players = new Map(Object.entries(room.players || {}));
		}
		if (room.players && room.players.has(playerId)) {
			room.players.delete(playerId);
		}
		room.playerCount = room.players ? room.players.size : 0;
		for (const [clientWs, info] of this.clients.entries()) {
			if (info && info.playerId === playerId) {
				this.clients.delete(clientWs);
			}
		}
		userService.send(ws, { type: 'left', gameId, playerId });
		this.broadcastRoomInfo(gameId, playerId, rooms);
		const isEmpty = !room.players || room.players.size === 0;
		return { roomEmpty: isEmpty, roomId: gameId };
	}
}

const instance = new GameService();
module.exports = instance;
module.exports.clients = instance.clients;

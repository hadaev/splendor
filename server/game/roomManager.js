class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> { players: Set, status }
    }

    get(roomId) {
        return this.rooms.get(roomId);
    }

    create(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                players: new Set(),
                status: 'waiting'
            });
        }
        return this.rooms.get(roomId);
    }

    addPlayer(roomId, playerId) {
        const room = this.create(roomId);
        room.players.add(playerId);
    }

    removePlayer(roomId, playerId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        room.players.delete(playerId);
    }

    list() {
        const arr = [];
        for (const [roomId, room] of this.rooms.entries()) {
            arr.push({
                roomId,
                players: room.players.size,
                status: room.status,
                maxPlayers: 4
            });
        }
        return arr;
    }
}

module.exports = RoomManager;
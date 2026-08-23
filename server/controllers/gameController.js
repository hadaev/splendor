const gameService = require("../services/gameService");

class GameController {
    async createRoom(req, res, next) {
        try {
            const { name } = req.body;
            const roomData = await gameService.createRoom(name);

            if (roomData.error) {
                return res.status(roomData.status || 400).json({ message: roomData.error });
            }

            return res.json(roomData);
        } catch (e) {
            next(e);
        }
    }

    async getRooms(req, res, next) {
        try {
            const rooms = await gameService.getRooms();
            return res.json(rooms);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new GameController()

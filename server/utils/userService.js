const clients = new Map();
class UserService {
    send(ws, msg) {
        ws.send(JSON.stringify(msg));
    }
    auth(ws, msg){
        const playerId = msg.playerId
        const name = msg.name
        clients.set(ws, { playerId, roomId: null, name });

        const userData = {
            type: 'auth_ok',
            playerId,
            playerName: name
        }

        this.send(ws, userData);
        return userData
    }
}

module.exports = new UserService();
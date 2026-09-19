import $api from "./http";

export default class GameService {
    static async onCreateRoom(name) {
        return $api.post('api/create-room', { name });
    }

    static async getRooms() {
        return $api.get('api/rooms');
    }
}
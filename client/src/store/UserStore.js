import {makeAutoObservable} from 'mobx';
import axios from 'axios';
import {API_URL} from '../services/http';
import AuthUser from '../services/AuthUser';

export default class UserStore {
    user = {};
    isAuthorized = false;
    isAuth = false;
    isLoading = false;
    playerId = localStorage.getItem("playerId") || '';
    playerName = localStorage.getItem("playerName") || ''
    roomId = localStorage.getItem("roomId") || ''
    connected = false
    roomInfo
    gameInfo
    client

    constructor() {
        makeAutoObservable(this);
        // this.webSocketClient();
    }

    setAuthorized(bool) {
        this.isAuthorized = bool;
    }

    setAuth(bool) {
        this.isAuth = bool;
    }

    setUser(user) {
        this.user = user;
    }

    setPlayerId(id) {
        this.playerId = id
    }

    setPlayerName(name) {
        this.playerName = name
    }

    setRoomId(roomId) {
        this.roomId = roomId
    }

    setConnected(bool) {
        this.connected = bool
    }

    setRoomInfo(msg) {
        this.roomInfo = msg
    }

    setGameInfo(msg) {
        this.gameInfo = msg
    }

    setClient(client) {
        this.client = client
    }

    setLoading(boll) {
        this.isLoading = boll;
    }

    // async webSocketClient() {
    //     const client = new GameClient('ws://localhost:8080');
    //     this.setClient(client)
    // }

    async login(name, password) {
        try {
            const response = await AuthUser.login(name, password);
            console.log(response);
            // localStorage.setItem('tokenUser', response.data.accessToken);
            localStorage.setItem('tokenUser', response.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            this.setAuth(true);
            this.setUser(response.data.user);
            return response.data.user;
        } catch (e) {
            return {error: true, message: e.response?.data?.message};
        }
    }

    async login2(playerName) {

        try {
            const playerId = "p_" + Math.random().toString(36).slice(2, 8);

            console.log('playerName', playerName);
            this.client.send({type: 'auth', name: playerName, playerId});

            if (playerId) localStorage.setItem("playerId", playerId);
            if (playerName) localStorage.setItem("playerName", playerName);
            // if (roomId) localStorage.setItem("roomId", roomId);

            this.setPlayerId(playerId);
            this.setPlayerName(playerName);

            console.log(playerName, 'LoginStore');
            return {playerId, playerName}
        } catch (e) {
            console.log(e);
        }


    }

    async handleJoinRoom(room, client) {
        // const client = new GameClient('ws://localhost:8080');
        this.setRoomId(room);
        localStorage.setItem('roomId', room)
        client.send({
            type: "join_game",
            gameId: room,
            playerName: this.playerName,
            playerId: this.playerId
        });
    };

    // async logout() {
    //     try {
    //         await AuthUserService.logout();
    //         localStorage.removeItem('tokenUser');
    //         localStorage.removeItem('deviceToken');
    //         this.setAuth(false);
    //         this.setUser({});
    //     } catch (e) {
    //         return { error: true, message: e.response?.data?.message };
    //     }
    // }
    //
    async checkAuth() {
        this.setLoading(true);
        try {
            const response = await axios.get(`${API_URL}api/refresh`, {withCredentials: true});
            console.log('check === ',response.data);
            if (response.data.message && !response.data.user){
                console.log(response.data.message);
                return response.data.message;
            }

            const token = response.data.accessToken || response.data.refreshToken;
            if (token) {
                localStorage.setItem('tokenUser', token);
            }

            const user = response.data.user || (response.data.name ? { name: response.data.name, id: response.data.id } : null);
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                this.setUser(user);
            }
            this.setAuth(true);
        } catch (e) {
            return {error: true, message: e.response?.data?.message};
        } finally {
            this.setLoading(false);
        }
    }

    async registration(name, password) {
        try {
            const response = await AuthUser.registration(name, password);
            console.log('registration uS',response.data);

            const token = response.data.accessToken || response.data.refreshToken;
            if (token) {
                localStorage.setItem('tokenUser', token);
            }

            const user = response.data.user || { name: response.data.name || name, id: response.data.id };
            localStorage.setItem('user', JSON.stringify(user));

            this.setUser(user);
            this.setAuth(true);
            return response.data;
        } catch (e) {
            return {error: true, message: e.response?.data?.message};
        }
    }

}
import React, {useContext, useEffect, useState} from 'react';
import {Context} from "../../index";
import {observer} from "mobx-react-lite";
import {useNavigate} from "react-router-dom";
import "./LobbyScreen.css";
import {WebSocketClient} from "../../ws/WebSocketClient";

const LobbyScreen = () => {
    const {userStore} = useContext(Context);
    const history = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState('');
    const [playerId, setPlayerId] = useState(userStore.playerId)
    const [roomInfo, setRoomInfo] = useState(() => {
        const storedRoomInfo = localStorage.getItem('roomInfo');
        return userStore.roomInfo || (storedRoomInfo ? JSON.parse(storedRoomInfo) : null);
    });
    const [client, setClient] = useState(userStore.client);
    const roomId = userStore.roomId

    useEffect(() => {
        // Если не авторизован — отправляем на логин
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!savedUser?.id || !savedUser?.name) {
            history('/login', { replace: true, state: { from: '/lobby' } });
            return;
        }

        const storedRoomInfo = localStorage.getItem('roomInfo');
        if (storedRoomInfo && !userStore.roomInfo) {
            const parsedRoomInfo = JSON.parse(storedRoomInfo);
            userStore.setRoomInfo(parsedRoomInfo);
            setRoomInfo(parsedRoomInfo);
        }

        const currentPlayerId = userStore.playerId || savedUser.id;
        const currentPlayerName = userStore.playerName || savedUser.name;
        const savedRoomId = userStore.roomId || localStorage.getItem('roomId');
        const socket = userStore.client || new WebSocketClient({});

        if (currentPlayerId) {
            userStore.setPlayerId(currentPlayerId);
            setPlayerId(currentPlayerId);
        }
        if (currentPlayerName) userStore.setPlayerName(currentPlayerName);
        if (savedRoomId) userStore.setRoomId(savedRoomId);
        userStore.setClient(socket);
        setClient(socket);

        const reconnectToRoom = () => {
            if (!currentPlayerId || !currentPlayerName) return;

            socket.send({ type: 'auth', playerId: currentPlayerId, name: currentPlayerName });
            if (savedRoomId) {
                socket.send({
                    type: 'join_game',
                    gameId: savedRoomId,
                    playerId: currentPlayerId,
                    playerName: currentPlayerName
                });
            }
        };

        socket.onOpen = reconnectToRoom;
        if (socket.ws?.readyState === WebSocket.OPEN) reconnectToRoom();
    }, [userStore]);


    useEffect(() => {
        console.log('isAuthorized22=', userStore.roomInfo);

        if (userStore.roomInfo && userStore.roomInfo.status === 'running') {
            history('/game-board');
        }
    }, []);


    function handleCreate() {
        if (!newRoom.trim()) return;
        client.send({type: 'create_room', roomId: newRoom.trim(), currentPlayerId: userStore.playerId});
    }


    // -----------------------------
    // 1. Подписка на сообщения
    // -----------------------------
    useEffect(() => {

        console.log(userStore.roomInfo, 'room info');
        if (!client) return;

        const removeListener = client.addListener((msg) => {
            if (msg.type === 'rooms_list') {
                setRooms(msg.rooms);
            }
            if (msg.type === 'room_created') {
                userStore.handleJoinRoom(msg.roomId, client);
            }
            if (msg.type === 'room_info') {
                userStore.setRoomInfo(msg);
                setRoomInfo(msg)
                localStorage.setItem('roomInfo', JSON.stringify(msg))
            }
            if (msg.status === 'running') {
                history('/game-board');
            }
            console.log(msg);
        });

        client.send({type: 'list_rooms'});
        console.log('Подписка на сообщения', rooms);

        return removeListener;
    }, [client, history, userStore]);

    const onStartGame = () => {
        console.log(roomId, playerId, '= onStartGame');
        client.send({ //то что я отправляю
            type: 'start_game',
            gameId: roomId,
            playerId
        });
        console.log('СТАРТ ИГРЫ');
        history('/game-board');
    };

    // -----------------------------
    // 2. Если мы уже в комнате — показываем комнату
    // -----------------------------
    console.log('1.Если мы уже в комнате — показываем комнату', roomInfo);

    // Используем актуальную информацию о комнате из стора или локального стейта
    const effectiveRoomInfo = roomInfo || userStore.roomInfo;

    if (effectiveRoomInfo) {
        console.log('2.Если мы уже в комнате — показываем комнату', effectiveRoomInfo);

        return (
            <div className="lobby-page">
                <h2>Комната: {effectiveRoomInfo.name || effectiveRoomInfo.roomId}</h2>
                <div>Статус: {effectiveRoomInfo.status}</div>

                <h3>Игроки:</h3>
                <ul>
                    {(effectiveRoomInfo.players || []).map((p) => (
                        <li key={p.id}>
                            {p.name}
                            {p.id === userStore.playerId ? " (вы)" : ""}
                        </li>
                    ))}
                </ul>

                {effectiveRoomInfo.status === "waiting" && (
                    <button
                        disabled={effectiveRoomInfo.players.length < 2}
                        className="button"
                        onClick={onStartGame}
                    >
                        Начать игру
                    </button>
                )}
            </div>
        );
    }

    // -----------------------------
    // 3. Экран списка комнат
    // -----------------------------
    console.log('Экран списка комнат');
    return (
        <div className="lobby-page">
            <h2>Выбор комнаты</h2>

            <div className="rooms">
                {rooms.map((room) => (
                    <div
                        key={room.roomId}
                        className="room"
                        onClick={() => {
                            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
                            if (!savedUser?.id || !savedUser?.name) {
                                history('/login', { state: { from: '/lobby' } });
                                return;
                            }
                            userStore.handleJoinRoom(room.roomId, client);
                        }}
                    >
                        <div>{room.roomId}</div>
                        <div className="playersCount">
                            {room.players} / 4
                        </div>
                    </div>
                ))}
            </div>

            <div className="create">
                <input
                    className="input"
                    placeholder="Название комнаты"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                />
                <button className="button" onClick={() => {
                    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
                    if (!savedUser?.id || !savedUser?.name) {
                        history('/login', { state: { from: '/lobby' } });
                        return;
                    }
                    handleCreate();
                }}>
                    Создать
                </button>
            </div>
        </div>
    );


}
export default observer(LobbyScreen)


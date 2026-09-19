import React, {useCallback, useContext, useEffect, useRef, useState} from "react";
import "./rooms.css";
import {Context} from "../../index";
import {WebSocketClient} from "../../ws/WebSocketClient";
import {useNavigate} from "react-router-dom";
import {observer} from "mobx-react-lite";
import GameService from "../../services/GameService";

function Rooms({ activeRoom = true, onJoinRoom }) {
    const [newRoomName, setNewRoomName] = useState("");
    const [createError, setCreateError] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [players, setPlayers] = useState([]);
    const [roomInfo, setRoomInfo] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef(null);
    const { gameStore, userStore } = useContext(Context);
    const navigate = useNavigate();

    const getCurrentUser = useCallback(() => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const playerId = userStore.playerId || userStore.user?.id || savedUser.id;
        const playerName = userStore.playerName || userStore.user?.name || savedUser.name;
        return { playerId, playerName };
    }, [userStore.playerId, userStore.playerName, userStore.user?.id, userStore.user?.name]);

    useEffect(() => {
        // Подгружаем существующие комнаты через REST API
        GameService.getRooms()
            .then((res) => {
                if (res.data && Array.isArray(res.data)) {
                    setRooms((prev) => (prev.length === 0 ? res.data : prev));
                }
            })
            .catch((e) => {
                console.error("Ошибка при получении комнат через REST:", e);
            });

        const client = userStore.client || new WebSocketClient({});
        clientRef.current = client;
        userStore.setClient(client);

        const removeListener = client.addListener((message) => {
            if (message.type === 'rooms_list') {
                setRooms(message.rooms || []);
            }

            if (message.type === 'room_created') {
                const { playerId, playerName } = getCurrentUser();
                userStore.setRoomId(message.roomId);
                localStorage.setItem('roomId', message.roomId);
                if (playerId && playerName) {
                    client.send({
                        type: 'join_game',
                        gameId: message.roomId,
                        playerId,
                        playerName
                    });
                }
            }

            if (message.type === 'room_info') {
                setRoomInfo(message);
                setPlayers(message.players || []);
                userStore.setRoomInfo(message);
                localStorage.setItem('roomInfo', JSON.stringify(message));
                client.send({ type: 'list_rooms' });
            }

            if (message.type === 'joined') {
                navigate('/lobby');
            }

            if (message.type === 'room_full') {
                setCreateError('В комнате уже четыре игрока');
            }

            if (message.type === 'unauthorized') {
                navigate('/login', { replace: true, state: { from: '/rooms' } });
            }

            if (message.type === 'error') {
                setCreateError(message.message || 'Не удалось выполнить операцию с комнатой');
            }
        });

        const handleOpen = () => {
            setIsConnected(true);
            const { playerId, playerName } = getCurrentUser();
            if (playerId && playerName) {
                client.send({ type: 'auth', playerId, name: playerName });
            }
            client.send({ type: 'list_rooms' });
        };

        client.onOpen = handleOpen;
        client.onClose = () => setIsConnected(false);

        if (client.ws?.readyState === WebSocket.OPEN) {
            handleOpen();
        }

        return () => {
            removeListener();
        };
    }, [navigate, userStore, getCurrentUser]);

    const handleCreate = async (e) => {
        e.preventDefault();
        const name = newRoomName.trim();
        if (!name) {
            setCreateError("Введите название комнаты");
            return;
        }

        const { playerId, playerName } = getCurrentUser();
        if (!playerId || !playerName) {
            navigate('/login', { state: { from: '/rooms' } });
            return;
        }

        if (!clientRef.current || !isConnected) {
            setCreateError('Подключение к лобби ещё не установлено');
            return;
        }

        setCreateError("");
        setIsCreating(true);
        const room = await gameStore.onCreateRoom(name);
        setIsCreating(false);

        if (room.error) {
            setCreateError(room.message);
            return;
        }

        setNewRoomName("");
        clientRef.current.send({
            type: 'create_room',
            roomId: room.id,
            roomName: room.name,
            currentPlayerId: playerId
        });

    };

    return (
        <div className="rooms-wrapper">
            <div className="rooms-container">

                {/* Активная комната */}
                <div className="active-room-card">
                    <h2 className="section-title">Активная комната</h2>

                    {roomInfo ? (
                        <>
                            <div className="active-room-name">{gameStore.room?.name || roomInfo.roomId}</div>

                            <div className="players-list">
                                {players.length === 0 && (
                                    <div className="empty">Пока никто не присоединился</div>
                                )}

                                {players.map((p) => (
                                    <div key={p.id} className="player-item">
                                        {p.name}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="empty">Вы ещё не в комнате</div>
                    )}
                </div>

                {/* Создание комнаты */}
                <div className="create-room-card">
                    <h2 className="section-title">Создать новую комнату</h2>

                    <form className="create-form" onSubmit={handleCreate}>
                        <input
                            className="input"
                            type="text"
                            placeholder="Название комнаты"
                            value={newRoomName}
                            onChange={(e) => {
                                setNewRoomName(e.target.value);
                                setCreateError("");
                            }}
                            maxLength={40}
                        />

                        <button className="btn-primary" type="submit" disabled={isCreating || !isConnected}>
                            Создать
                        </button>
                    </form>
                    {createError && <div className="form-error" role="alert">{createError}</div>}
                </div>

                {/* Список комнат */}
                <div className="rooms-list-card">
                    <h2 className="section-title">Доступные комнаты</h2>

                    {rooms.length === 0 && (
                        <div className="empty">Пока нет созданных комнат</div>
                    )}

                    <div className="rooms-list">
                        {rooms.map((room) => (
                            <div key={room.roomId} className="room-item">
                                <span>{room.name || `Комната #${room.roomId}`} ({room.players || 0}/{room.maxPlayers || 4})</span>
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        const { playerId, playerName } = getCurrentUser();
                                        if (!playerId || !playerName) {
                                            navigate('/login', { state: { from: '/rooms' } });
                                            return;
                                        }
                                        gameStore.setRoom({ id: room.roomId, name: room.name });
                                        userStore.setRoomId(room.roomId);
                                        localStorage.setItem('roomId', room.roomId);
                                        clientRef.current.send({
                                            type: 'join_game',
                                            gameId: room.roomId,
                                            playerId,
                                            playerName
                                        });
                                    }}
                                    disabled={room.status !== 'waiting' || (room.players >= (room.maxPlayers || 4))}
                                >
                                    Войти
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default observer(Rooms);

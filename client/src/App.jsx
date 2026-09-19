import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import {useAuth} from "./context/AuthContext";
import {useGame} from "./context/GameContext";
import {BrowserRouter} from 'react-router-dom';

import Router from "./Routes";
import {Context} from "./index";

export function App() {
    const {playerId, playerName, roomId, isAuthorized, login, joinRoom} = useAuth();
    const {game, setGame} = useGame();
    const clientRef = useRef(null);
    const wsRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [roomInfo, setRoomInfo] = useState(null);
    const {userStore} = useContext(Context)

    useMemo(() => {
        if (localStorage.getItem('tokenUser')) {
            userStore.checkAuth();
        }
    }, []);

    // -----------------------------
    // СОЗДАНИЕ WEBSOCKET ПОСЛЕ playerId
    // -----------------------------
    useEffect(() => {
        // if (!playerId) return;
        // if (clientRef.current) return; // не пересоздаём
        //
        // const client = new GameClient('ws://localhost:8080');
        // clientRef.current = client;
        //
        // // авторизация
        // console.log('playerName', playerName);
        // client.send({ type: 'auth', name: playerName, playerId });

        // если игрок был в комнате — повторно присоединяемся
        // console.log('если игрок был в комнате — повторно присоединяемся',roomId);
        // const savedRoom = localStorage.getItem("roomId");
        // const currentPlayerId = localStorage.getItem("playerId");
        // if (savedRoom) {
        //   client.send({
        //     type: 'join_game',
        //     gameId: savedRoom,
        //     playerName,
        //     currentPlayerId
        //   });
        // }
        // console.log('СОЗДАНИЕ WEBSOCKET ПОСЛЕ playerId', playerId);
    }, [playerId, playerName]);


    // 1. Инициализация WebSocket
    // useEffect(() => {
    //   wsRef.current = new WebSocketClient({
    //     onOpen: () => {
    //       setConnected(true);
    //       //send type and playerId and name
    //       if (playerId) {
    //         wsRef.current.send({
    //           type: "auth",
    //           playerId,
    //           name: playerName
    //         });
    //       }
    //
    //       if (playerId && roomId) {
    //         wsRef.current.send({
    //           type: "join_game",
    //           gameId: roomId,
    //           playerName
    //         });
    //       }
    //     },
    //
    //     onMessage: (msg) => {
    //       if (msg.type === "joined") {
    //         joinRoom(msg.gameId);
    //       }
    //
    //       if (msg.type === "game_state") {
    //         setGame(msg.game);
    //       }
    //
    //       if (msg.type === 'room_info') {
    //         setRoomInfo(msg);
    //         console.log('room_info',msg);
    //       }
    //
    //       if (msg.type === 'room_full') {
    //         alert("Комната заполнена");
    //       }
    //       console.log(msg,game,'СОЗДАНИЕ WEBSOCKET ПОСЛЕ playerId');
    //     },
    //
    //     onClose: () => {
    //       setConnected(false);
    //     }
    //   });
    //
    //   console.log(roomInfo, 'roomInfo');
    // }, []);


    // 3. Вход в комнату
    // const handleJoinRoom = (room) => {
    //   joinRoom(room);
    //
    //   wsRef.current.send({
    //     type: "join_game",
    //     gameId: room,
    //     playerName
    //   });
    // };


    // -----------------------------
    // СТАРТ ИГРЫ
    // -----------------------------
    // const handleStartGame = () => {
    //   clientRef.current.send({ //то что я отправляю
    //     type: 'start_game',
    //     gameId: roomId,
    //     playerId
    //   });
    //   console.log('СТАРТ ИГРЫ');
    // };

    // -----------------------------
    // ХОД ИГРОКА
    // -----------------------------
    // const handleMove = (move) => {
    //   clientRef.current.send({
    //     type: 'make_move',
    //     gameId: roomId,
    //     playerId,
    //     move
    //   });
    //   console.log('ХОД ИГРОКА');
    // };

    // -----------------------------
    // ЭКРАНЫ
    // -----------------------------
    // 4. UI


    // if (!roomId) {
    //   if (!clientRef.current) return null;
    //
    //   return (
    //       <LobbyScreen
    //           client={clientRef.current}
    //           playerId={playerId??localStorage.getItem("playerId")}
    //           roomInfo={roomInfo}
    //           onJoinRoom={handleJoinRoom}
    //           onStartGame={handleStartGame}
    //       />
    //   );
    // }
// Если мы в комнате, но игра ещё НЕ началась — показываем LobbyScreen
//   if (roomId && roomInfo && roomInfo.status === "waiting") {
//     return (
//         <LobbyScreen
//             client={clientRef.current}
//             playerId={playerId??localStorage.getItem("playerId")}
//             roomInfo={roomInfo}
//             onJoinRoom={handleJoinRoom}
//             onStartGame={handleStartGame}
//         />
//     );
//   }

// Если игра уже началась, но game_state ещё не пришёл
//   if (roomInfo && roomInfo.status === "running") {
//     return <div style={{ padding: 20 }}>Загрузка игры…</div>;
//   }
    // if (!game) {
    //   console.log(game,'=game');
    //   return <div style={{ padding: 20 }}>Загрузка игры…</div>;
    // }
    console.log('ЭКРАНЫ', game, roomInfo);
    return (
        <BrowserRouter>
            <Router/>
        </BrowserRouter>
    );
}
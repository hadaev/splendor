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
    console.log('ЭКРАНЫ', game, roomInfo);
    return (
        <BrowserRouter>
            <Router/>
        </BrowserRouter>
    );
}
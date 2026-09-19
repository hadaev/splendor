import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [playerId, setPlayerId] = useState(() => localStorage.getItem("playerId"));
    const [playerName, setPlayerName] = useState(() => localStorage.getItem("playerName"));
    const [roomId, setRoomId] = useState(() => localStorage.getItem("roomId"));

    const isAuthorized = Boolean(playerId && playerName);

    useEffect(() => {
        if (playerId) localStorage.setItem("playerId", playerId);
        if (playerName) localStorage.setItem("playerName", playerName);
        if (roomId) localStorage.setItem("roomId", roomId);
    }, [playerId, playerName, roomId]);

    const login = (name) => {
        const id = "p_" + Math.random().toString(36).slice(2, 8);
        setPlayerId(id);
        setPlayerName(name);
    };

    const joinRoom = (room) => {
        setRoomId(room);
    };

    const logout = () => {
        setPlayerId(null);
        setPlayerName(null);
        setRoomId(null);
        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{
            playerId,
            playerName,
            roomId,
            isAuthorized,
            login,
            joinRoom,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
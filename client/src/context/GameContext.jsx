import React, { createContext, useContext, useState } from "react";

const GameContext = createContext(null);

export function GameProvider({ children }) {
    const [game, setGame] = useState(null);

    return (
        <GameContext.Provider value={{ game, setGame }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    return useContext(GameContext);
}
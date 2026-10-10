import React from "react";

export const StatusPlayer = (activePlayer) => {
    return (
        <div className="turn-lock" aria-hidden="true">
            <span>Ход выполняет {activePlayer?.name || 'другой игрок'}</span>
        </div>
    );
};
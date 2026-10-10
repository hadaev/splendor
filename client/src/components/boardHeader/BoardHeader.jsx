import React from "react";

export function BoardHeader({roomTitle, isMyTurn, activePlayer, roomStatus, onStartGame, onLeaveRoom}) {
    return (
        <div className="board-header">
            <div className="room-title">{roomTitle}</div>
            <div className="board-header-actions">
                <div className={`turn-status${isMyTurn ? ' turn-status-active' : ''}`} role="status">
                    {isMyTurn ? 'Ваш ход' : `Ход выполняет ${activePlayer?.name || 'другой игрок'}`}
                </div>
                {roomStatus === 'waiting' && (
                    <button className="start-button" onClick={onStartGame}>Начать игру</button>
                )}
                <button className="leave-button" onClick={onLeaveRoom}>Покинуть комнату</button>
            </div>
        </div>
    );
}
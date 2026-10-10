import React from "react";

export const CardChoiceReserve = ({ reserveableCards, selectedReserveCardId, handleCardSelection }) => {
    return (
        <div className="first-turn-card-choice">
            <div className="first-turn-hint">
                Выберите карту для резервирования
            </div>
            <div className="first-turn-card-list">
                {reserveableCards.map((card) => (
                    <button
                        key={card.id}
                        type="button"
                        onClick={() => handleCardSelection(card)}
                        className={`first-turn-card${selectedReserveCardId === card.id ? ' first-turn-card-selected' : ''}`}
                    >
                        <div className="first-turn-card-points">{card.points}⭐</div>
                        <div className="first-turn-card-cost">
                            {Object.entries(card.cost).map(([color, amount]) => (
                                <span key={color} className="first-turn-card-cost-item">{color}:{amount}</span>
                            ))}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
import React from "react";
import "./cardRow.css";
import gemRed from "../deckStack/assets/gem-red.svg";
import gemBlue from "../deckStack/assets/gem-blue.svg";
import gemGreen from "../deckStack/assets/gem-green.svg";
import gemWhite from "../deckStack/assets/gem-white.svg";
import gemBlack from "../deckStack/assets/gem-black.svg";

const gemByColor = {red: gemRed, blue: gemBlue, green: gemGreen, white: gemWhite, black: gemBlack};

export default function CardRow({ cards, onCardClick, selectedCardId, disableIfUnaffordable = false, isAffordable = () => true }) {
    if (!cards || cards.length === 0) {
        return <div className="cardrow-empty">Нет открытых карт</div>;
    }

    return (
        <div className="cardrow-wrapper">
            {cards.map((card) => {
                const isSelected = selectedCardId === card.id;
                const affordable = isAffordable(card);
                const cardDisabled = disableIfUnaffordable && !affordable;

                return (
                    <button
                        key={card.id}
                        type="button"
                        className={`cardrow-card card-bg-${card.bonus} ${isSelected ? 'cardrow-card-selected' : ''} ${cardDisabled ? 'cardrow-card-disabled' : ''} ${affordable ? 'cardrow-card-affordable' : 'cardrow-card-unaffordable'}`}
                        onClick={() => {
                            if (cardDisabled || !onCardClick) return;
                            onCardClick(card);
                        }}
                        disabled={cardDisabled}
                        title={cardDisabled ? 'Недостаточно ресурсов для покупки' : 'Выбрать карту'}
                        aria-label={cardDisabled ? 'Недостаточно ресурсов для покупки карты' : 'Выбрать карту'}
                        style={{
                            cursor: onCardClick && !cardDisabled ? 'pointer' : 'default',
                            border: isSelected ? '2px solid #ffd166' : affordable ? '2px solid rgba(76, 175, 80, 0.95)' : '2px solid rgba(220, 53, 69, 0.9)',
                            boxShadow: isSelected ? '0 0 12px rgba(255,209,102,0.45)' : affordable ? '0 0 12px rgba(76, 175, 80, 0.42)' : '0 0 12px rgba(220, 53, 69, 0.35)',
                            opacity: cardDisabled ? 0.7 : 1
                        }}
                    >
                        <div className="cardrow-points">{card.points}⭐</div>

                        <div className="cardrow-bonus bonus-circle">
                            {card.bonus !== "none" && gemByColor[card.bonus] && <img className="cardrow-bonus-gem" src={gemByColor[card.bonus]} alt={`Бонус: ${card.bonus}`}/>} 
                        </div>

                        <div className="cardrow-cost">
                            {Object.entries(card.cost).map(([color, amount]) => (
                                <div key={color} className={`cost-item cost-${color}`}>
                                    {amount}
                                </div>
                            ))}
                        </div>

                        {cardDisabled && <div className="cardrow-id-row"><span className="cardrow-disabled-label">Нет</span></div>}
                    </button>
                );
            })}
        </div>
    );
}

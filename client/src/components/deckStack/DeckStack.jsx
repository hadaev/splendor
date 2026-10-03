import React from "react";
import "./deckStack.css";
import gemYellow from "./assets/gem-yellow.svg";
import gemGreen from "./assets/gem-green.svg";
import gemBlue from "./assets/gem-blue.svg";
import gemBrown from "./assets/gem-brown.svg";

const gemsByLevel = {
    1: {src: gemYellow, label: "Жёлтый кристалл"},
    2: {src: gemGreen, label: "Зелёный кристалл"},
    3: {src: gemBlue, label: "Синий кристалл"}
};

export default function DeckStack({ level, count, variant }) {
    const isNobleDeck = variant === "noble";
    const gem = isNobleDeck ? {src: gemBrown, label: "Коричневый кристалл"} : (gemsByLevel[level] || gemsByLevel[1]);

    return (
        <div className="deck-stack">
            <div className={`deck-card ${isNobleDeck ? "deck-card-noble" : `deck-card-level-${level}`}`}>
                <img className="deck-gem" src={gem.src} alt={gem.label}/>
                {!isNobleDeck && <div className="deck-level">Уровень {level}</div>}
            </div>

            <div className="deck-count">{count}</div>
        </div>
    );
}

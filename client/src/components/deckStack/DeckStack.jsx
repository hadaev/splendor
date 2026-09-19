import React from "react";
import "./deckStack.css";

export default function DeckStack({ level, count }) {
    return (
        <div className="deck-stack">
            <div className="deck-card">
                <div className="deck-level">L{level}</div>
            </div>

            <div className="deck-count">{count}</div>
        </div>
    );
}

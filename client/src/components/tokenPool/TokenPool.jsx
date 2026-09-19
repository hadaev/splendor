import React from "react";
import "./tokenPool.css";

export default function TokenPool({ tokens, onTake, selected = {} }) {
    if (!tokens) return null;

    const colors = Object.keys(tokens);

    return (
        <div className="tokenpool-wrapper">
            {colors.map((color) => (
                <div
                    key={color}
                    className={`token-item token-${color} ${selected[color] ? 'selected' : ''}`}
                    onClick={() => onTake && onTake(color)}
                >
                    <div className="token-amount">{tokens[color]}</div>
                    {selected[color] ? <div className="selected-count">{selected[color]}</div> : null}
                </div>
            ))}
        </div>
    );
}

import React from "react";
import "./nobleRow.css";

export default function NobleRow({ nobles, onNobleClick, selectedNobleId }) {
    if (!nobles || nobles.length === 0) {
        return <div className="nobles-empty">Нет благородных</div>;
    }

    return (
        <div className="nobles-row">
            {nobles.map((noble) => (
                <button
                    key={noble.id}
                    type="button"
                    className={`noble-card${selectedNobleId === noble.id ? ' selected' : ''}`}
                    onClick={() => onNobleClick?.(noble)}
                    disabled={!onNobleClick}
                    style={{
                        cursor: onNobleClick ? 'pointer' : 'default',
                        opacity: onNobleClick ? 1 : 0.9
                    }}
                >
                    <div className="noble-points">{noble.points}⭐</div>

                    <div className="noble-cost">
                        {Object.entries(noble.cost).map(([color, amount]) => (
                            <div key={color} className={`cost-item cost-${color}`}>
                                {amount}
                            </div>
                        ))}
                    </div>

                    <div className="noble-id">{noble.id}</div>
                    {onNobleClick && <div className="noble-action">Выбрать</div>}
                </button>
            ))}
        </div>
    );
}

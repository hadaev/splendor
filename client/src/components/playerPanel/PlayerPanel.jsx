import React from "react";
import "./playerPanel.css";

const COLOR_ORDER = { red: 0, blue: 1, green: 2, white: 3, black: 4 };

export default function PlayerPanel({ players, activePlayerId, viewerPlayerId, canBuyReservedCards, onReservedCardClick, selectedTokens = {} }) {
    if (!players || players.length === 0) {
        return <div className="playerpanel-empty">Игроков пока нет</div>;
    }

    const getVisibleTokens = (player) => {
        if (player.id !== activePlayerId) return player.tokens || {};

        const merged = { ...(player.tokens || {}) };
        Object.entries(selectedTokens || {}).forEach(([color, amount]) => {
            merged[color] = (merged[color] || 0) + Number(amount || 0);
        });

        return merged;
    };

    const getCardTheme = (card) => {
        const color = card?.bonus && card.bonus !== 'none' ? card.bonus : 'white';

        return {
            borderColor: color === 'red' ? '#d9534f' : color === 'blue' ? '#0275d8' : color === 'green' ? '#5cb85c' : color === 'black' ? '#222' : '#f7f7f7',
            background: color === 'red' ? 'linear-gradient(135deg, #f7d0cf, #d9534f)' : color === 'blue' ? 'linear-gradient(135deg, #cfe7ff, #0275d8)' : color === 'green' ? 'linear-gradient(135deg, #d9f5d9, #5cb85c)' : color === 'black' ? 'linear-gradient(135deg, #4b4b4b, #111)' : 'linear-gradient(135deg, #ffffff, #d9d9d9)'
        };
    };

    const sortByColor = (cards) => [...cards].sort((a, b) => {
        const aColor = a?.bonus && a.bonus !== 'none' ? a.bonus : 'white';
        const bColor = b?.bonus && b.bonus !== 'none' ? b.bonus : 'white';
        return (COLOR_ORDER[aColor] ?? 99) - (COLOR_ORDER[bColor] ?? 99);
    });
    console.log('players:', players);
    return (
        <div className="playerpanel-wrapper">
            {players.map((player) => {
                const isViewer = String(player.id) === String(viewerPlayerId);
                const visibleTokens = getVisibleTokens(player);
                const purchasedCards = sortByColor(Array.isArray(player.purchasedCards) ? player.purchasedCards : []);
                const reservedCards = sortByColor(Array.isArray(player.reservedCards) ? player.reservedCards : []);
                const claimedNobles = Array.isArray(player.claimedNobles) ? [...player.claimedNobles] : [];
                const groupedCards = purchasedCards.reduce((acc, card) => {
                    const color = card?.bonus && card.bonus !== 'none' ? card.bonus : 'white';
                    if (!acc[color]) acc[color] = [];
                    acc[color].push(card);
                    return acc;
                }, {});

                return (
                    <div
                        key={player.id}
                        className={
                            "player-card" +
                            (player.id === activePlayerId ? " player-active" : "")
                        }
                    >
                        <div className="player-header">
                            <div className="player-name">{player.name}</div>
                            <div className="player-points">{player.points}⭐</div>
                        </div>

                        <div className="player-section">
                            <div className="player-section-title">Фишки</div>
                            <div className="player-tokens">
                                {Object.entries(visibleTokens).map(([color, amount]) => (
                                    <div key={color} className={`token-item token-${color}`}>
                                        {amount}
                                    </div>
                                ))}
                            </div>
                            {(purchasedCards.length > 0 || reservedCards.length > 0 || claimedNobles.length > 0) && (
                                <div className="purchased-cards-preview">
                                    {purchasedCards.length > 0 && Object.entries(groupedCards).sort(([colorA], [colorB]) => (COLOR_ORDER[colorA] ?? 99) - (COLOR_ORDER[colorB] ?? 99)).map(([color, cards]) => (
                                        <div key={color} className={`purchased-color-group purchased-color-group-${color}`}>
                                            <span className="purchased-color-label">{color}</span>
                                            <div className={`purchased-stack purchased-stack-${color}`}>
                                                {cards.map((card, index) => {
                                                    const theme = getCardTheme(card);
                                                    const depth = cards.length - index - 1;
                                                    const offsetY = depth * 14;
                                                    const offsetX = depth * 2;

                                                    const costEntries = Object.entries(card.cost || {});
                                                    return (
                                                       <button
                                                           type="button"
                                                           key={`${card.id}-${card.points}-${index}`}
                                                           className="purchased-card-mini mini-card-button"
                                                           style={{
                                                               borderColor: theme.borderColor,
                                                               background: theme.background,
                                                               transform: `translate(${offsetX}px, ${offsetY}px)`,
                                                               zIndex: cards.length - index,
                                                               opacity: 1 - index * 0.08
                                                           }}
                                                           title={`${card.id} • ${card.points}⭐ • Стоимость: ${costEntries.map(([color, amount]) => `${color}:${amount}`).join(', ')}`}
                                                       >
                                                           <span className="mini-card-points">{card.points}</span>
                                                           <span className="mini-card-bonus">{card.bonus && card.bonus !== 'none' ? card.bonus[0].toUpperCase() : ''}</span>
                                                           <div className="mini-card-cost">
                                                               {costEntries.map(([color, amount]) => (
                                                                   <span key={`${card.id}-${color}-mini`} className={`mini-cost-dot mini-cost-${color}`} title={`${color}: ${amount}`}>
                                                                       {amount}
                                                                   </span>
                                                               ))}
                                                           </div>
                                                       </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    {claimedNobles.length > 0 && (
                                        <div className="nobles-cards-group">
                                            <span className="purchased-color-label">noble</span>
                                            <div className="nobles-stack">
                                                {claimedNobles.map((noble, index) => {
                                                    const depth = claimedNobles.length - index - 1;
                                                    const offsetY = depth * 12;
                                                    const offsetX = depth * 2;

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={`${noble.id}-noble-${index}`}
                                                            className="noble-card-mini mini-card-button"
                                                            style={{
                                                                transform: `translate(${offsetX}px, ${offsetY}px)`,
                                                                zIndex: claimedNobles.length - index,
                                                                opacity: 1 - index * 0.08
                                                            }}
                                                            title={`${noble.id} • ${noble.points}⭐ • Стоимость: ${Object.entries(noble.cost || {}).map(([color, amount]) => `${color}:${amount}`).join(', ')}`}
                                                        >
                                                            <span className="mini-card-points">{noble.points}</span>
                                                            <span className="mini-card-bonus">N</span>
                                                            <div className="mini-card-cost">
                                                                {Object.entries(noble.cost || {}).map(([color, amount]) => (
                                                                    <span key={`${noble.id}-${color}-mini`} className={`mini-cost-dot mini-cost-${color}`} title={`${color}: ${amount}`}>
                                                                        {amount}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {reservedCards.length > 0 && (
                                        <div className="reserved-cards-group">
                                            <span className="purchased-color-label">reserve</span>
                                            <div className="reserved-stack">
                                                {reservedCards.map((card, index) => {
                                                    const theme = getCardTheme(card);
                                                    const costEntries = Object.entries(card.cost || {});
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={`${card.id}-reserved-${index}`}
                                                            className="reserved-card-mini mini-card-button"
                                                            onClick={() => isViewer && canBuyReservedCards && onReservedCardClick?.(card)}
                                                            disabled={!isViewer || !canBuyReservedCards || !onReservedCardClick}
                                                            style={{
                                                                borderColor: theme.borderColor,
                                                                background: theme.background,
                                                                transform: `translate(${index * 24}px, -${index * 5}px)`,
                                                                zIndex: reservedCards.length - index,
                                                                opacity: 1 - index * 0.08
                                                            }}
                                                            title={`Резерв: ${card.id} • ${card.points}⭐ • Стоимость: ${costEntries.map(([color, amount]) => `${color}:${amount}`).join(', ')}`}
                                                        >
                                                            <span className="mini-card-points">{card.points}</span>
                                                            <span className="mini-card-bonus">{card.bonus && card.bonus !== 'none' ? card.bonus[0].toUpperCase() : ''}</span>
                                                            <div className="mini-card-cost">
                                                                {costEntries.map(([color, amount]) => (
                                                                    <span key={`${card.id}-${color}-mini`} className={`mini-cost-dot mini-cost-${color}`} title={`${color}: ${amount}`}>
                                                                        {amount}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

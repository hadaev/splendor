import React from 'react';
import GemIcon from './GemIcon';
import { GEM_COLORS } from '../constants/colors';

const tierBackgrounds = {
    1: `
        radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6), rgba(255,255,255,0) 60%),
        radial-gradient(circle at 70% 80%, rgba(0,0,0,0.15), rgba(0,0,0,0) 70%),
        linear-gradient(135deg, #f4f1e6 0%, #e6e2d4 40%, #d8d4c8 100%)
    `,
    2: `
        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4), rgba(255,255,255,0) 60%),
        radial-gradient(circle at 80% 70%, rgba(0,0,0,0.3), rgba(0,0,0,0) 70%),
        linear-gradient(135deg, #d9c8a8 0%, #c4b18f 40%, #b29d7a 100%)
    `,
    3: `
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25), rgba(255,255,255,0) 60%),
        radial-gradient(circle at 75% 75%, rgba(0,0,0,0.45), rgba(0,0,0,0) 70%),
        linear-gradient(135deg, #8c6b2f 0%, #6e5224 40%, #4d3818 100%)
    `
};

export default function Card({ card, onMove, isActiveTurn, canAfford = () => true }) {
    const disabled = !isActiveTurn || !canAfford(card);
    const bonusColorKey = card.bonus && card.bonus !== 'none' ? card.bonus : null;
    const borderColor = bonusColorKey ? GEM_COLORS[bonusColorKey] : '#ffffff';

    const handleBuy = () => {
        if (disabled) return;
        onMove({
            type: 'buy_card',
            cardId: card.id,
            from: 'table'
        });
    };

    return (
        <div
            style={{
                ...styles.card,
                borderColor,
                opacity: disabled ? 0.55 : 1,
                transform: disabled ? 'scale(0.98)' : 'scale(1)',
                pointerEvents: disabled ? 'none' : 'auto'
            }}
        >
            {/* Верхняя панель */}
            <div style={styles.top}>
                <div style={styles.points}>{card.points}</div>
                <div
                    style={{
                        ...styles.gemDot,
                        background: borderColor
                    }}
                />
            </div>

            {/* Арт */}
            <div
                style={{
                    ...styles.art,
                    background: tierBackgrounds[card.tier]
                }}
            />

            {/* Стоимость */}
            <div style={styles.cost}>
                {Object.entries(card.cost).map(([gem, amount]) => (
                    <div key={gem} style={styles.costRow}>
                        <GemIcon gem={gem} size={20} />
                        <span style={styles.costAmount}>{amount}</span>
                    </div>
                ))}
            </div>

            {/* Кнопка */}
            <button
                style={{
                    ...styles.button,
                    background: disabled
                        ? '#444'
                        : 'linear-gradient(135deg, #1d2b64, #1e3c72)',
                    cursor: disabled ? 'not-allowed' : 'pointer'
                }}
                disabled={disabled}
                onClick={handleBuy}
            >
                Купить
            </button>
        </div>
    );
}

const styles = {
    card: {
        width: 160,
        height: 240,
        padding: 12,
        borderRadius: 14,
        background: '#fafafa',
        border: '4px solid',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: `
            0 6px 14px rgba(0,0,0,0.35),
            inset 0 0 6px rgba(255,255,255,0.4)
        `,
        transition: '0.25s ease',
        position: 'relative'
    },

    top: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    points: {
        fontSize: 28,
        fontWeight: 700,
        color: '#222',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
    },

    gemDot: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '2px solid rgba(0,0,0,0.25)',
        boxShadow: '0 0 6px rgba(0,0,0,0.25)'
    },

    art: {
        flex: 1,
        marginTop: 8,
        marginBottom: 8,
        borderRadius: 8,
        boxShadow: `
            inset 0 0 12px rgba(0,0,0,0.25),
            inset 0 0 24px rgba(0,0,0,0.15)
        `,
        filter: 'contrast(1.05) brightness(1.05)'
    },

    cost: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
    },

    costRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
    },

    costAmount: {
        fontSize: 15,
        fontWeight: 600,
        color: '#222'
    },

    button: {
        marginTop: 8,
        padding: '6px 10px',
        borderRadius: 6,
        border: 'none',
        color: '#fff',
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        transition: '0.2s ease'
    }
};
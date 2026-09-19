import React from 'react';
import GemIcon from './GemIcon';

export default function PlayerPanel({ player, isYou, isActive }) {
    return (
        <div
            style={{
                ...styles.panel,
                borderColor: isActive ? '#32cd75' : 'rgba(255,255,255,0.06)',
                boxShadow: isActive
                    ? '0 0 12px rgba(50,205,117,0.35)'
                    : '0 0 6px rgba(0,0,0,0.25)',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
            }}
        >
            {/* Заголовок */}
            <div style={styles.header}>
                <span style={styles.name}>{player.name}</span>
                {isYou && <span style={styles.you}>Вы</span>}
            </div>

            {/* Очки */}
            <div style={styles.points}>
                <span style={styles.pointsValue}>{player.points}</span>
                <span style={styles.pointsLabel}>очков</span>
            </div>

            {/* Жетоны */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>Жетоны</div>
                <div style={styles.tokenList}>
                    {Object.entries(player.tokens).map(([gem, count]) => (
                        <div key={gem} style={styles.tokenRow}>
                            <GemIcon gem={gem} size={20} />
                            <span style={styles.tokenAmount}>{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Бонусы */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>Бонусы</div>
                <div style={styles.tokenList}>
                    {Object.entries(player.bonuses).map(([gem, count]) => (
                        <div key={gem} style={styles.tokenRow}>
                            <GemIcon gem={gem} size={20} />
                            <span style={styles.tokenAmount}>{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = {
    panel: {
        background: 'rgba(15, 18, 35, 0.85)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: 14,
        color: '#d0d4e4',
        marginBottom: 14,
        transition: '0.25s ease',
        backdropFilter: 'blur(6px)',
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },

    name: {
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: 0.3,
    },

    you: {
        fontSize: 11,
        padding: '2px 6px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.12)',
        color: '#fff',
    },

    points: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        marginBottom: 12,
    },

    pointsValue: {
        fontSize: 26,
        fontWeight: 700,
        color: '#fff',
        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
    },

    pointsLabel: {
        fontSize: 12,
        color: 'rgba(200,200,220,0.6)',
    },

    section: {
        marginBottom: 10,
    },

    sectionTitle: {
        fontSize: 12,
        color: 'rgba(200,200,220,0.5)',
        marginBottom: 4,
        letterSpacing: 0.5,
    },

    tokenList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
    },

    tokenRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(255,255,255,0.06)',
        padding: '4px 8px',
        borderRadius: 8,
        boxShadow: 'inset 0 0 6px rgba(0,0,0,0.25)',
    },

    tokenAmount: {
        fontSize: 14,
        fontWeight: 600,
        color: '#fff',
    },
};
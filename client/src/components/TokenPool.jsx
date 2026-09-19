import React from 'react';
import GemIcon from './GemIcon';
// import Token from './Token';
export default function TokenPool({ tokens, onMove, isActiveTurn }) {
    const handleTake = (gem) => {
        if (!isActiveTurn) return;

        onMove({
            type: 'take_tokens',
            tokens: { [gem]: 1 }
        });
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.title}>Жетоны</span>
                <span style={styles.sub}>{Object.values(tokens).reduce((a, b) => a + b, 0)} всего</span>
            </div>

            <div style={styles.grid}>
                {Object.entries(tokens).map(([gem, count]) => (
                    <div
                        key={gem}
                        style={{
                            ...styles.tokenWrapper,
                            opacity: count === 0 ? 0.35 : 1,
                            cursor: isActiveTurn && count > 0 ? 'pointer' : 'default'
                        }}
                        onClick={() => count > 0 && handleTake(gem)}
                    >
                        <div style={styles.token}>
                            <GemIcon gem={gem} size={32} />
                        </div>

                        <div style={styles.count}>{count}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '14px 16px',
        borderRadius: 12,
        background: 'rgba(15, 18, 35, 0.85)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(6px)',
        marginTop: 20
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid rgba(255,255,255,0.06)'
    },

    title: {
        fontSize: 16,
        fontWeight: 600,
        color: '#d0d4e4'
    },

    sub: {
        fontSize: 13,
        color: 'rgba(200,200,220,0.5)'
    },

    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
        gap: 14,
        marginTop: 10
    },

    tokenWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: '0.2s ease',
        userSelect: 'none'
    },

    token: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: `
            0 3px 6px rgba(0,0,0,0.35),
            inset 0 0 6px rgba(255,255,255,0.15)
        `,
        transition: '0.2s ease'
    },

    count: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: 600,
        color: '#d0d4e4'
    }
};
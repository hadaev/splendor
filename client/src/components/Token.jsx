// client/src/components/Token.jsx
import React from 'react';
import GemIcon from './GemIcon';

export default function Token({ gem, count, onClick, isActiveTurn }) {
    const disabled = count <= 0 || !isActiveTurn;

    return (
        <div
            style={{
                ...styles.token,
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'default' : 'pointer'
            }}
            onClick={disabled ? undefined : onClick}
        >
            <GemIcon gem={gem} size={20} />
            <div style={styles.count}>{count}</div>
        </div>
    );
}

const styles = {
    token: {
        width: 60,
        height: 60,
        borderRadius: '50%',
        border: '3px solid #111',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        background: '#ddd'
    },
    count: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111',
        marginTop: 2
    }
};
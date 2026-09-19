// client/src/components/GemIcon.jsx
import React from 'react';
import { GEM_COLORS } from '../constants/colors';

export default function GemIcon({ gem, size = 22 }) {
    const fill = GEM_COLORS[gem] || '#ccc';

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{
                display: 'block',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))'
            }}
        >
            <defs>
                {/* Основной объёмный градиент */}
                <radialGradient id={`gem-grad-${gem}`} cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                    <stop offset="35%" stopColor={fill} stopOpacity="1" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
                </radialGradient>

                {/* Блик сверху */}
                <radialGradient id={`gem-gloss-${gem}`} cx="50%" cy="0%" r="60%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* Основной круг */}
            <circle
                cx="12"
                cy="12"
                r="10"
                fill={`url(#gem-grad-${gem})`}
                stroke="#111"
                strokeWidth="1.4"
            />

            {/* Блик */}
            <circle
                cx="12"
                cy="8"
                r="6"
                fill={`url(#gem-gloss-${gem})`}
            />
        </svg>
    );
}
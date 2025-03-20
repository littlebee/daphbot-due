import React from "react";

export const Forward10sIcon: React.FC = () => {
    return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Almost closed circle with a small gap */}
            <circle
                style={{
                    transformOrigin: "center",
                    transform: "rotate(120deg)",
                }}
                cx={16}
                cy={16}
                r={14}
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="60 50"
            />
            {/* Arrow near the gap */}
            <polygon points="21,13 32,13 32,19" fill="currentColor" />
            {/* "10s" text */}
            <text
                x={22}
                y={30}
                textAnchor="middle"
                fontSize="12"
                fill="currentColor"
                fontWeight="bold"
            >
                10s
            </text>
        </svg>
    );
};

export default Forward10sIcon;

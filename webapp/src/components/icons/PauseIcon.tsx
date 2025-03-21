import React from "react";

export const PauseIcon: React.FC = () => {
    return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Two rectangles with a small gap */}
            <rect x="8" y="6" width="4" height="20" fill="currentColor" />
            <rect x="20" y="6" width="4" height="20" fill="currentColor" />
        </svg>
    );
};

export default PauseIcon;

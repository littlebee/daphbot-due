import React from "react";

export const PlayIcon: React.FC = () => {
    return (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* triangle path with rounded corners */}
            <path d="M8 26V6L26 16L8 26Z" fill="currentColor" />
            {/* empty rectangle path */}
            <path d="M0 0H32V32H0V0Z" fill="none" />
        </svg>
    );
};

export default PlayIcon;

import React from "react";

import { classnames } from "../util/classNames";
import st from "./Button.module.css";

interface ButtonProps {
    className?: string;
    children: React.ReactNode;
    isSelected?: boolean;
    onClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

export function Button({
    className,
    children,
    isSelected,
    onClick,
}: ButtonProps) {
    const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();

        onClick(e);
    };

    const buttonCls = classnames(className, "button", st.button, {
        predicate: isSelected,
        value: st.buttonSelected,
    });
    return (
        <div className={buttonCls} onClick={handleClick}>
            {children}
        </div>
    );
}

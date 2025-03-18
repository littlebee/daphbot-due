import { useCallback } from "react";

import * as du from "./dateUtils";

import st from "./RangeSelector.module.css";

export const DEFAULT_DURATION = 30; // minutes

interface RangeSelectorProps {
    // List of valid ranges to select from
    validRanges: du.DateRange[];
    // This is a controlled component
    range: du.DateRange;

    onRangeChange: (newRange: du.DateRange) => void;
}

export const RangeSelector: React.FC<RangeSelectorProps> = ({
    validRanges,
    range,
    onRangeChange,
}) => {
    const handleOnChange = useCallback(
        (event: React.ChangeEvent<HTMLSelectElement>) => {
            const newRange = validRanges.find(
                (r) => r.name === event.target.value
            );
            if (newRange) onRangeChange(newRange);
        },
        [validRanges, onRangeChange]
    );

    return (
        <select
            className={st.rangeSelector}
            value={range.name}
            onChange={handleOnChange}
        >
            {validRanges.map((range) => (
                <option key={range.name} value={range.name}>
                    {range.name}
                </option>
            ))}
        </select>
    );
};

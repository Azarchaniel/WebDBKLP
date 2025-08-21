import { FC } from "react";
import "@styles/ThreeStateCheckbox.scss";

type ThreeStateCheckboxProps = {
    selectedAmount: number,
    totalAmount: number,
    onChange: (value: boolean | null) => void,
    className?: string,
    disabled?: boolean,
}

export const ThreeStateCheckbox: FC<ThreeStateCheckboxProps> = ({
    selectedAmount,
    totalAmount,
    onChange,
    className = "",
    disabled = false
}) => {
    const isIndeterminate = selectedAmount > 0 && totalAmount > 0 && selectedAmount < totalAmount;
    const isChecked = totalAmount > 0 && selectedAmount === totalAmount;

    const handleChange = () => {
        if (isIndeterminate || !isChecked) {
            onChange(true);
        } else {
            onChange(false);
        }
    };

    return (
        <input
            type="checkbox"
            checked={isChecked}
            onChange={handleChange}
            className={`${className} three-state-checkbox`}
            disabled={disabled}
            ref={(el) => {
                if (el) {
                    el.indeterminate = isIndeterminate;
                }
            }}
            title={isIndeterminate ? `Čiastočne vybrané: ${selectedAmount}` : isChecked ? "Vybrané" : "Nevybrané"}
        />
    )
}

export default ThreeStateCheckbox;
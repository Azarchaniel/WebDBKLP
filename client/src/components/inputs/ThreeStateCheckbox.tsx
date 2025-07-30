import {FC} from "react";

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
    const isIndeterminate = selectedAmount > 0 && selectedAmount < totalAmount;
    const isChecked = selectedAmount === totalAmount;

    const handleChange = () => {
        console.log(`Checkbox changed: ${selectedAmount} ${totalAmount}`);
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
            className={`three-state-checkbox ${className}`
            }
            disabled={disabled}
            ref={(el) => {
                if (el) {
                    el.indeterminate = isIndeterminate;
                }
            }}
            title={isIndeterminate ? "Čiastočne vybrané" : isChecked ? "Vybrané" : "Nevybrané"}
        />
    )
}

export default ThreeStateCheckbox;
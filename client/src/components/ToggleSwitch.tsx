import React from "react";
import "../styles/toggleSwitch.scss";

interface ToggleProps {
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    optionLabels: string[];
    name?: string;
    small?: boolean;
    disabled?: boolean;
}

export const ToggleSwitch = ({
                                 id,
                                 name,
                                 checked,
                                 onChange,
                                 optionLabels,
                                 small,
                                 disabled
                             }: ToggleProps) => {

    function handleKeyPress(e: any) {
        if (e.keyCode !== 32) return;

        e.preventDefault();
        onChange(!checked);
    }

    return (
        <div className={"toggle-switch" + (small ? " small-switch" : "")}>
            <input
                type="checkbox"
                name={name}
                className="toggle-switch-checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            {id ? (
                <label
                    className="toggle-switch-label"
                    tabIndex={disabled ? -1 : 1}
                    onKeyDown={(e) => handleKeyPress(e)}
                    htmlFor={id}
                >
					<span
                        className={
                            disabled
                                ? "toggle-switch-inner toggle-switch-disabled"
                                : "toggle-switch-inner"
                        }
                        data-yes={optionLabels[0]}
                        data-no={optionLabels[1]}
                        tabIndex={-1}
                    />
                    <span
                        className={
                            disabled
                                ? "toggle-switch-switch toggle-switch-disabled"
                                : "toggle-switch-switch"
                        }
                        tabIndex={-1}
                    />
                </label>
            ) : null}
        </div>
    );
};

// Props for ThreeStateToggleSwitch
interface ThreeStateToggleProps {
    id: string;
    state: boolean | undefined;
    onChange: (state: boolean | undefined) => void;
    optionLabels: [string, string, string]; // [true, undefined, false]
    name?: string;
    small?: boolean;
    disabled?: boolean;
}

export const ThreeStateToggleSwitch = ({
    id,
    name,
    state,
    onChange,
    optionLabels,
    small,
    disabled
}: ThreeStateToggleProps) => {
    // Helper to determine which part is active
    const getActiveClass = (target: boolean | undefined) =>
        state === target ? ' three-state-active' : '';

    function handleClick(target: boolean | undefined) {
        if (!disabled) onChange(target);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (disabled) return;
        if (e.key === 'ArrowLeft') {
            onChange(false);
        } else if (e.key === 'ArrowRight') {
            onChange(true);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
            onChange(undefined);
        }
    }

    return (
        <div
            className={
                'toggle-switch three-state-switch' + (small ? ' small-switch' : '') + (disabled ? ' toggle-switch-disabled' : '')
            }
            tabIndex={disabled ? -1 : 0}
            onKeyDown={handleKeyDown}
            aria-disabled={disabled}
            role="group"
            aria-label={name || id}
        >
            <div
                className={'three-state-option three-state-true' + getActiveClass(true)}
                onClick={() => handleClick(true)}
                tabIndex={-1}
                aria-label={optionLabels[0]}
            >
                {optionLabels[0]}
            </div>
            <div
                className={'three-state-option three-state-undefined' + getActiveClass(undefined)}
                onClick={() => handleClick(undefined)}
                tabIndex={-1}
                aria-label={optionLabels[1]}
            >
                {optionLabels[1]}
            </div>
            <div
                className={'three-state-option three-state-false' + getActiveClass(false)}
                onClick={() => handleClick(false)}
                tabIndex={-1}
                aria-label={optionLabels[2]}
            >
                {optionLabels[2]}
            </div>
        </div>
    );
};


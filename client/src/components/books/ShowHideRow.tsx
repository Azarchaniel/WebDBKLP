import { ReactElement, useState } from "react";

type ShowHideRowProps = {
    label: string,
    init: boolean,
    onChange: (state: boolean) => void
}

export const ShowHideRow = ({label, init, onChange}: ShowHideRowProps): ReactElement => {
    const [state, setState] = useState<boolean>(init);

    return (<div className="showHideRow">
        <label>
            <input type='checkbox'
                    className="hideShowCheckbox"
                    checked={state}
                    onChange={() => {onChange(!state); setState(!state)}}
                    title={state ? "Zobraziť" : "Skryť"}
            />
            {label}
        </label>
    </div>)
}
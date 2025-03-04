import React, { ReactElement, useState } from "react";

type ShowHideRowProps = {
    label: string,
    init: boolean,
    onChange: (state: boolean) => void
}

export const ShowHideRow = React.memo(({label, init, onChange}: ShowHideRowProps): ReactElement => {
	const [state, setState] = useState<boolean>(init);

	return (<div className="showHideRow">
		<label>
			<input type='checkbox'
				className="hideShowCheckbox"
				checked={state}
				onChange={() => {onChange(!state); setState(!state)}}
				title={state ? "Skryť" : "Zobraziť"}
			/>
			{label}
		</label>
	</div>)
});
import React, { ReactElement, useState } from "react";
import { useTranslation } from "react-i18next";

type ShowHideRowProps = {
    label: string,
    init: boolean,
    onChange: (state: boolean) => void
}

export const ShowHideRow = React.memo(({ label, init, onChange }: ShowHideRowProps): ReactElement => {
    const { t } = useTranslation();
    const [state, setState] = useState<boolean>(init);

    return (<div className="showHideRow">
        <label>
            <input type='checkbox'
                className="hideShowCheckbox"
                checked={state}
                onChange={() => { onChange(!state); setState(!state) }}
                title={state ? t("common.hide") : t("common.show")}
            />
            {label}
        </label>
    </div>)
});
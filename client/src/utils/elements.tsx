import ReactTooltip from "react-tooltip";

export const TooltipedText = (elementText: string, tooltipText: string) => {
    return (
        <div>
            <span data-tip>
                {elementText}
            </span>
            <ReactTooltip place="bottom" effect="solid" className="tooltipA">
                <span>{tooltipText}</span>
            </ReactTooltip>
        </div>
    )
}
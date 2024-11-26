import { useEffect, useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";

export const TooltipedText = (elementText: string, tooltipText: string) => {
    return (
        <div>
            <span data-tip>
                {elementText}
            </span>
            <ReactTooltip place="bottom" className="tooltipA">
                <span>{tooltipText}</span>
            </ReactTooltip>
        </div>
    )
}

export const ScrollToTopBtn = ({scrollToTop = () => {}}) => {
    const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
    const handleScroll = () => {
        setShowScrollToTop(window.scrollY !== 0);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        showScrollToTop ? <button title="Skrolovať navrch" className="scrollToTop" onClick={() => scrollToTop()}/> : <></>
    )
}
import { useEffect, useId, useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useTranslation } from "react-i18next";

interface TooltipedTextProps {
	elementText: string;
	tooltipText: string;
	spanClass?: string;
}

export const TooltipedText = ({ elementText, tooltipText, spanClass }: TooltipedTextProps) => {
	const tooltipId = useId();

	return (
		<div>
			<span data-tooltip-id={tooltipId} data-tooltip-content={tooltipText} className={spanClass}>
				{elementText}
			</span>
			<ReactTooltip id={tooltipId} place="bottom" className="tooltipA" />
		</div>
	)
}

export const ScrollToTopBtn = ({ scrollToTop = () => { } }) => {
	const { t } = useTranslation();
	const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
	const handleScroll = () => {
		setShowScrollToTop(window.scrollY !== 0);
	};

	useEffect(() => {
		window.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	return (
		showScrollToTop ? <button data-tooltip-id="global-tooltip" data-tooltip-content={t("common.scrollTop")} className="scrollToTop" onClick={() => scrollToTop()} /> : <></>
	)
}
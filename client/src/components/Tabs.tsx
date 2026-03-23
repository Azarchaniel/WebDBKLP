import React, { useEffect, useRef, useState } from "react";

interface TabsProps {
	children: any | any[];
	className?: string;
}

interface TabProps {
	children: React.ReactNode;
	label: string;
}

const Tabs = ({ children, className = "" }: TabsProps) => {
	if (!Array.isArray(children)) {
		children = [children];
	}

	const [activeTab, setActiveTab] = useState(children[0]?.props.label || "");
	const headerRef = useRef<HTMLDivElement | null>(null);

	const invertWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
		const header = headerRef.current;
		if (!header) return;

		if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
			e.preventDefault();
			header.scrollLeft += e.deltaY;
		}
	};

	useEffect(() => {
		if (!children.find((child: any) => child.props.label === activeTab)) {
			setActiveTab(children[0]?.props.label || "");
		}
	}, [children, activeTab]);

	return (
		<div className={`tabs-container ${className}`.trim()}>
			<div className="tabs-header" ref={headerRef} onWheel={invertWheelScroll}>
				{children.map((child: any) => (
					<button
						key={child.props.label}
						className={`tab-button ${activeTab === child.props.label ? "active" : ""}`}
						onClick={() => setActiveTab(child.props.label)}
					>
						{child.props.label}
					</button>
				))}
			</div>
			<div className="tabs-content">
				{children.map((child: any) => (
					activeTab === child.props.label ? (
						<div key={child.props.label} className="tab-panel">
							{child.props.children}
						</div>
					) : null
				))}
			</div>
		</div>
	);
};

const Tab = ({ label, children }: TabProps) => {
	return <div data-label={label}>{children}</div>;
};

export { Tabs, Tab };

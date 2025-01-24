import React, {useEffect, useState} from "react";

interface TabsProps {
    children: any | any[];
}

interface TabProps {
    children: React.ReactNode;
    label: string;
}

const Tabs = ({ children }: TabsProps) => {
	if (!Array.isArray(children)) {
		children = [children];
	}

	const [activeTab, setActiveTab] = useState(children[0]?.props.label || "");

	useEffect(() => {
		//find .tabs-header on page and if you have hover over tabs, scroll horizontally
		const header = document.querySelector(".tabs-header");
		window.addEventListener("wheel", function (e) {
			if (!header) return;
			if ((e.target as Element).matches(".tab-button")) {
				if (e.deltaY > 0) header.scrollLeft += 30;
				else header.scrollLeft -= 30;
			}
		});
	}, []);

	return (
		<div className="tabs-container">
			<div className="tabs-header">
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
						<div key={child.props.label} className="tab-pane">
							{child.props.children}
						</div>
					) : null
				))}
			</div>
		</div>
	);
};

const Tab = ({ label, children }: TabProps) => {
	return <div dadta-label={label}>{children}</div>;
};

export { Tabs, Tab };

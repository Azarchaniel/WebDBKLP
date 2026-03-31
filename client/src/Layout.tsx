import React, { ReactNode } from 'react';
import Header from './components/AppHeader';
import Sidebar from './components/Sidebar';
import Toast from "./components/Toast";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface LayoutProps {
    children: ReactNode;
}

const renderGlobalTooltip = ({ content, activeAnchor }: { content: string | null; activeAnchor: HTMLElement | null }) => {
    const picture = activeAnchor?.dataset.tooltipPicture;

    if (activeAnchor?.dataset.tooltipType === "book-cover" && picture) {
        return (
            <div className="bookCoverTooltip">
                <img src={picture} alt={content || "Book cover"} className="bookCoverTooltipImage" />
                {content && <span className="bookCoverTooltipTitle">{content}</span>}
            </div>
        );
    }

    return content;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <main className='App'>
            <Header />
            <Sidebar />
            {children}
            <Toast />
            <Tooltip id="global-tooltip" positionStrategy="fixed" style={{ zIndex: 11000 }} opacity={1} render={renderGlobalTooltip} />
        </main>
    );
};

export default Layout;
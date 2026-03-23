import React, { ReactNode } from 'react';
import Header from './components/AppHeader';
import Sidebar from './components/Sidebar';
import Toast from "./components/Toast";
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <main className='App'>
            <Header />
            <Sidebar />
            {children}
            <Toast />
            <Tooltip id="global-tooltip" positionStrategy="fixed" style={{ zIndex: 11000 }} />
        </main>
    );
};

export default Layout;
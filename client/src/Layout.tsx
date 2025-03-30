import React, { ReactNode } from 'react';
import Header from './components/AppHeader';
import Sidebar from './components/Sidebar';
import Toast from "./components/Toast";

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
        </main>
    );
};

export default Layout;
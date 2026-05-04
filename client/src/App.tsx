import React from "react";
import "react-toastify/dist/ReactToastify.css";
import "./index.scss"
import { AuthProvider } from "@utils/context";
import { ModalProvider } from "@utils/context/ModalContext";
import Layout from "./Layout";
import { Outlet } from "react-router-dom";
import { ErrorBoundary } from "@components/ErrorBoundary";

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ModalProvider>
                    <Layout>
                        <Outlet />
                    </Layout>
                </ModalProvider>
            </AuthProvider>
        </ErrorBoundary>
    )
};

export default App;

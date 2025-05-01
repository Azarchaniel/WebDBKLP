import React from "react";
import "react-toastify/dist/ReactToastify.css";
import "./index.scss"
import {AuthProvider} from "@utils/context";
import Layout from "./Layout";
import {Outlet} from "react-router-dom";

const App: React.FC = () => {
    return (
        <AuthProvider>
            <Layout>
               <Outlet />
            </Layout>
        </AuthProvider>
    )
};

export default App;

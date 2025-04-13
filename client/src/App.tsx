import React, {useEffect} from "react";
import "react-toastify/dist/ReactToastify.css";
import "./index.scss"
import {useLocalStorage} from "usehooks-ts";
import {getUsers} from "./API";
import {AuthProvider} from "@utils/context";
import Layout from "./Layout";
import {Outlet} from "react-router-dom";

const App: React.FC = () => {
    const [_, setOwners] = useLocalStorage("cachedUsers", [] as string[]);

    useEffect(() => {
        const cached = localStorage.getItem("cachedUsers");

        if (cached) {
            setOwners(JSON.parse(cached));
        } else {
            getUsers()
                .then(({data: {users}}) => {
                    setOwners(users.map(u => JSON.stringify(u)));
                    localStorage.setItem("cachedUsers", JSON.stringify(users));
                })
                .catch((err: Error) => console.trace(err));
        }
    }, []);

    return (
        <AuthProvider>
            <Layout>
               <Outlet />
            </Layout>
        </AuthProvider>
    )
};

export default App;

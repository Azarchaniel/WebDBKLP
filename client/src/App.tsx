import React, {useEffect} from "react";
import "react-toastify/dist/ReactToastify.css";
import "./index.scss"
import Toast from "./components/Toast";
import Sidebar from "./components/Sidebar";
import Header from "./components/AppHeader";
import DashboardPage from "./pages/dashboard/DashboardPage";
import {useLocalStorage} from "usehooks-ts";
import {getUsers} from "./API";

const App: React.FC = () => {
	const [_, setOwners] = useLocalStorage("cachedUsers", [] as string[]);

	useEffect(() => {
		const cached = localStorage.getItem("cachedUsers");

		if (cached) {
			setOwners(JSON.parse(cached));
		} else {
			getUsers()
				.then(({ data: { users } }) => {
					setOwners(users.map(u => JSON.stringify(u)));
					localStorage.setItem("cachedUsers", JSON.stringify(users));
				})
				.catch((err: Error) => console.trace(err));
		}
	}, []);

	return (
		<main className='App'>
			<Sidebar />
			<Header />
			<DashboardPage />
			<Toast />
		</main>
	)
};

export default App;

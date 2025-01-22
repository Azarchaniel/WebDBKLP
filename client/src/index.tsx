import App from "./App"
import {BrowserRouter, Routes, Route} from "react-router-dom";
import BookPage from "./pages/books/BookPage";
import AutorPage from "./pages/autors/AutorPage";
import QuotePage from "./pages/quotes/QuotePage";
import LPPage from "./pages/lps/LPPage";
import BoardGamesPage from "./pages/boardGames/BoardGamesPage";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<App/>}/>
			<Route path="/books" element={<BookPage/>}/>
			<Route path="/autors" element={<AutorPage/>}/>
			<Route path="/lp" element={<LPPage/>}/>
			<Route path="/quotes" element={<QuotePage/>}/>
			<Route path="/board-games" element={<BoardGamesPage/>}/>
		</Routes>
	</BrowserRouter>
)

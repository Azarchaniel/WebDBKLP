import App from "./App"
import ReactDOM from "react-dom"
import "bootstrap/dist/css/bootstrap.css";
import "../node_modules/font-awesome/css/font-awesome.min.css";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import BookPage from "./pages/books/BookPage";
import AutorPage from "./pages/autors/AutorPage";
import QuotePage from "./pages/quotes/QuotePage";
import LPPage from "./pages/lps/LPPage";

ReactDOM.render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<App/>}/>
			<Route path="/books" element={<BookPage/>}/>
			<Route path="/autors" element={<AutorPage/>}/>
			<Route path="/lp" element={<LPPage/>}/>
			<Route path="/quotes" element={<QuotePage/>}/>
		</Routes>
	</BrowserRouter>
	,
	document.getElementById("root"),
)

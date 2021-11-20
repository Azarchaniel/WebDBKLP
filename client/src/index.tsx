import App from './App'
import ReactDOM from 'react-dom'
import React from 'react'
import "bootstrap/dist/css/bootstrap.css";
import '../node_modules/font-awesome/css/font-awesome.min.css';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import BookPage from "./pages/books/BookPage";
import AutorPage from "./pages/autors/AutorPage";
import QuotePage from "./pages/quotes/QuotePage";

// const components = {
//     '/books': <Books />,
//     '/books/:id': <Books id={id} />
// }

ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/books" element={<BookPage />} />
                <Route path="/autors" element={<AutorPage />} />
                <Route path="/quotes" element={<QuotePage />} />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root'),
)

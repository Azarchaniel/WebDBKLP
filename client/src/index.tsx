import App from './App'
import ReactDOM from 'react-dom'
import React from 'react'
import "bootstrap/dist/css/bootstrap.css";
import '../node_modules/font-awesome/css/font-awesome.min.css';
import {BrowserRouter, Routes, Route} from "react-router-dom";
import BookPage from "./pages/books/BookPage";
import AutorPage from "./pages/autors/AutorPage";
import QuotePage from "./pages/quotes/QuotePage";
import LPPage from "./pages/lps/LPPage";
import BookDetail from './pages/books/BookDetail';

// const components = {
//     '/books': <Books />,
//     '/books/:id': <Books id={id} />
// }

ReactDOM.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App/>}/>
            <Route path="/books" element={<BookPage/>}/>
            <Route path="/book/:id" element={<BookDetail/>}/>
            <Route path="/autors" element={<AutorPage/>}/>
            <Route path="/lp" element={<LPPage/>}/>
            <Route path="/quotes" element={<QuotePage/>}/>
        </Routes>
    </BrowserRouter>
    ,
    document.getElementById('root'),
)

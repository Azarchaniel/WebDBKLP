import { createBrowserRouter, RouterProvider } from "react-router-dom";
import BookPage from "./pages/books/BookPage";
import AutorPage from "./pages/autors/AutorPage";
import QuotePage from "./pages/quotes/QuotePage";
import LPPage from "./pages/lps/LPPage";
import BoardGamesPage from "./pages/boardGames/BoardGamesPage";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "@utils/context";
import DashboardPage from "./pages/dashboard/DashboardPage";
import App from "./App";
import UtilPage from "pages/utils/outside-utils";
import KzpPage from "./pages/utils/KzpPage";
import "./i18n";

const localhostHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const isLocalhost = localhostHosts.has(window.location.hostname);
document.title = isLocalhost ? "WebDBKLP - TEST" : "WebDBKLP";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: "books", element: <BookPage /> },
            { path: "books/:id", element: <BookPage /> },
            { path: "autors", element: <AutorPage /> },
            { path: "autors/:id", element: <AutorPage /> },
            { path: "lp", element: <LPPage /> },
            { path: "quotes", element: <QuotePage /> },
            { path: "board-games", element: <BoardGamesPage /> },
        ],
    },
    { path: "/utils", element: <UtilPage /> },
    { path: "/kzp", element: <KzpPage /> },
]);

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
    <AuthProvider>
        <RouterProvider router={router} />
    </AuthProvider>
)

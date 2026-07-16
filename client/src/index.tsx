import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LoadingBooks } from "@components/LoadingBooks";
import "./i18n";

const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const BookPage = lazy(() => import("./pages/books/BookPage"));
const AutorPage = lazy(() => import("./pages/autors/AutorPage"));
const QuotePage = lazy(() => import("./pages/quotes/QuotePage"));
const LPPage = lazy(() => import("./pages/lps/LPPage"));
const BoardGamesPage = lazy(() => import("./pages/boardGames/BoardGamesPage"));
const UtilPage = lazy(() => import("./pages/utils/outside-utils"));
const KzpPage = lazy(() => import("./pages/utils/KzpPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const lazyRoute = (Page: ComponentType) => (
    <Suspense fallback={<LoadingBooks />}>
        <Page />
    </Suspense>
);

const localhostHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const isLocalhost = localhostHosts.has(window.location.hostname);
document.title = isLocalhost ? "WebDBKLP - TEST" : "WebDBKLP";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { index: true, element: lazyRoute(DashboardPage) },
            { path: "books", element: lazyRoute(BookPage) },
            { path: "books/:id", element: lazyRoute(BookPage) },
            { path: "autors", element: lazyRoute(AutorPage) },
            { path: "autors/:id", element: lazyRoute(AutorPage) },
            { path: "lp", element: lazyRoute(LPPage) },
            { path: "quotes", element: lazyRoute(QuotePage) },
            { path: "board-games", element: lazyRoute(BoardGamesPage) },
        ],
    },
    { path: "/utils", element: lazyRoute(UtilPage) },
    { path: "/kzp", element: lazyRoute(KzpPage) },
    { path: "*", element: lazyRoute(NotFoundPage) },
]);

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
    <RouterProvider router={router} />
)
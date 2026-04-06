import React, { forwardRef, useEffect, useRef, useState } from "react";
import "../styles/font-awesome/css/all.css";
import "../styles/sidebar.scss";
import { ISideMenuItems } from "../type";
import { Link, useLocation } from "react-router-dom";
import { useClickOutside } from "@hooks";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

interface HamburgerToXProps {
    onClick: () => void;
    className: string;
    activeEl: boolean;
    label: string;
}

const HamburgerToX = forwardRef<HTMLDivElement, HamburgerToXProps>(({ onClick, className, activeEl, label }, ref) => {
    const [active, setActive] = useState<boolean>(activeEl);

    useEffect(() => {
        setActive(activeEl);
    }, [activeEl]);

    return (
        <div className={className} ref={ref}>
            <div className="hamburger" onClick={() => {
                setActive(!active);
                onClick()
            }}>
                <a className={"main-nav-toggle" + (active ? " active-menu" : "")}><i>{label}</i></a>
            </div>
        </div>
    )
});

const Sidebar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const [sidebarOpened, setSidebarOpened] = useState<boolean>(false);
    const popRef = useRef<HTMLDivElement>(null);
    const exceptRef = useRef<HTMLDivElement>(null);

    useClickOutside(popRef, () => {
        setSidebarOpened(false);
    }, exceptRef);

    const content: ISideMenuItems[] = [
        {
            title: t("nav.books"),
            icon: "fas fa-book",
            route: "/books",
        },
        {
            title: t("nav.autors"),
            icon: "fas fa-feather-alt",
            route: "/autors",
        },
        {
            title: t("nav.lps"),
            icon: "fas fa-record-vinyl",
            route: "/lp",
        },
        {
            title: t("nav.boardGames"),
            icon: "fas fa-chess",
            route: "/board-games",
        },
        {
            title: t("nav.quotes"),
            icon: "fas fa-pen-nib",
            route: "/quotes",
        }
    ];

    return (
        <>
            <nav className={"sideBar" + (sidebarOpened ? " opened" : "")} ref={popRef}>
                <HamburgerToX
                    className="toggleBtn"
                    onClick={() => setSidebarOpened(!sidebarOpened)}
                    ref={exceptRef}
                    activeEl={sidebarOpened}
                    label={t("common.menu")}
                />
                {content.map(item => (
                    <Link to={item.route} key={item.route} className={location.pathname === item.route ? "active" : ""}>
                        <i className={item.icon} />
                        {sidebarOpened && <span>{item.title}</span>}
                    </Link>
                ))}
                <div style={{ display: "flex", alignItems: "center", flexGrow: 1 }}>{/* Empty space */}</div>
                <LanguageSwitcher sidebarOpened={sidebarOpened} />
                <a
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={t("nav.aboutAuthor")}
                    href="https://github.com/Azarchaniel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                >
                    <i className="fab fa-github" />
                    {sidebarOpened && <span>{t("nav.aboutAuthor")}</span>}
                </a>
            </nav>
        </>
    )
}


export default Sidebar;
import React, {useEffect, useRef, useState} from "react";
import "../styles/font-awesome/css/all.css";
import "../styles/sidebar.scss";
import {ISideMenuItems} from "../type";
import {Link, useLocation} from "react-router-dom";
import {ActivateUserList} from "./ActivateUserList";
import {useClickOutside} from "../utils/hooks";

const HamburgerToX = ({onClick, className, ref, activeEl}: { onClick: () => void; className: string; ref: React.RefObject<HTMLDivElement>, activeEl: boolean }) => {
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
                <a className={"main-nav-toggle" + (active ? " active-menu" : "")}><i>Menu</i></a>
            </div>
        </div>
    )
}

const Sidebar = () => {
    const location = useLocation();
    const [sidebarOpened, setSidebarOpened] = useState<boolean>(false);
    const popRef = useRef<HTMLDivElement>(null);
    const exceptRef = useRef<HTMLDivElement>(null);

    useClickOutside(popRef, () => {
        setSidebarOpened(false);
    }, exceptRef);

    const content: ISideMenuItems[] = [
        {
            title: "Knihy",
            icon: "fas fa-book",
            route: "/books",
        },
        {
            title: "Autori",
            icon: "fas fa-feather-alt",
            route: "/autors",
        },
        {
            title: "LP",
            icon: "fas fa-record-vinyl",
            route: "/lp",
        },
        {
            title: "Úryvky",
            icon: "fas fa-pen-nib",
            route: "/quotes",
        },
        {
            title: "Spoločenské hry",
            icon: "fas fa-chess",
            route: "/board-games",
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
                />
                {content.map(item => (
                    <Link to={item.route} key={item.route} className={location.pathname === item.route ? "active" : ""}>
                        <i className={item.icon}/>
                        {sidebarOpened && <span>{item.title}</span>}
                    </Link>
                ))}
                <ActivateUserList />
            </nav>
        </>
    )
}


export default Sidebar;
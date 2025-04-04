import React, {useState} from "react";
import "../styles/font-awesome/css/all.css";
import "../styles/sidebar.scss";
import {ISideMenuItems} from "../type";
import {Link, useLocation} from "react-router-dom";
import {ActivateUserList} from "./ActivateUserList";

const HamburgerToX = ({onClick, className}: { onClick: () => void; className: string }) => {
    const [active, setActive] = useState<boolean>(false);

    return (
        <div className={className}>
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
            <nav className={"sideBar" + (sidebarOpened ? " opened" : "")}>
                <HamburgerToX className="toggleBtn" onClick={() => setSidebarOpened(!sidebarOpened)}/>
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
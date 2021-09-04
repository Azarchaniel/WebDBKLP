import React, {useState} from "react";
import '../styles/font-awesome/css/all.css';
import {ISideMenuItems} from "../type";

const Sidebar = () => {
    const [sidebarOpened, setSidebarOpened] = useState<boolean>(false);
    const [SBCopened, setSBCopened] = useState<any>({
        books: false,
        quotes: false
    });
    const content: ISideMenuItems[] = [
        {
            title: 'Knihy',
            icon: 'fas fa-book',
            route: 'books',
            children: [
                {
                    title: 'Ľuboš',
                    route: 'books/lubos', //todo: there should be User table and then ID
                },
                {
                    title: 'Žaneta',
                    route: 'books/zaneta',
                },
            ],
        },
        {
            title: 'LP',
            icon: 'fas fa-record-vinyl',
            route: 'lp',
        },
        {
            title: 'Úryvky',
            icon: 'fas fa-pen-nib',
            route: 'quotes',
            children: [
                {
                    title: 'Ľuboš',
                    route: 'quotes/lubos',
                },
                {
                    title: 'Žaneta',
                    route: 'quotes/zaneta',
                },
            ],
        }
    ];

    const showContent = (contentItems: ISideMenuItems[]) => {
        //todo: make it a function and then recursion over children, because in future we could make more children
        return contentItems.map((item: ISideMenuItems) => {
            if (sidebarOpened) {
                if (!item.children) {
                    return <div className="SB-Parent">
                        {item.icon ? <i className={item.icon}>&nbsp;</i> : <></>}
                        <span>{item.title}</span>
                        &nbsp;
                    </div>
                } else {
                    return <div className="SB-Parent">
                        {item.icon ? <i className={item.icon}>&nbsp;</i> : <></>}
                        <span>{item.title}</span>
                        &nbsp;
                        <i className="fas fa-chevron-down SB-chevron" onClick={() => setSBCopened({[item.route]: true})}/>
                        {
                            SBCopened ?
                            item.children.map((child: ISideMenuItems) =>
                            <div className="SB-Child">{child.title}</div>) :
                                <></>

                        }
                    </div>
                }
            } else {
                //sidebar closed
                if (!item.children) {
                    return <div className="SB-Parent">
                        {item.icon ? <i className={item.icon}>&nbsp;</i> : <>{item.title.substring(0,1)}</>}
                    </div>
                } else {
                    return <div className="SB-Parent">
                        {item.icon ? <i className={item.icon}>&nbsp;</i> : <></>}
                        {
                            item.children.map((child: ISideMenuItems) =>
                                <div className="SB-Child">{child.title.substring(0,1)}</div>)
                        }
                    </div>
                }
            }
        });
    }

    return (
        <div className={sidebarOpened ? "sideBarOpened" : "sideBarClosed"}>
            {sidebarOpened ? <span
                className="closeIcon"
                onClick={() => setSidebarOpened(!sidebarOpened)}
                ><i className="fas fa-times"></i></span> : <span
                className="closeIcon"
                onClick={() => setSidebarOpened(!sidebarOpened)}
            ><i className="fas fa-bars"></i></span>}

            {showContent(content)}

        </div>
    );
}

export default Sidebar;

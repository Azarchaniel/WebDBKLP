import React, {useState} from "react";
import '../styles/font-awesome/css/all.css';
import {IBook, ISideMenuItems} from "../type";

type PropsSB = {
    parent: ISideMenuItems
}

const SingleLevel: React.FC<PropsSB> = ({parent}) => {
    return (
        <div className="SB-Parent">
            {parent.icon ? <i className={parent.icon}>&nbsp;</i> : <></>}
            <span>{parent.title}</span>
            &nbsp;
        </div>);
}

const MultiLevel: React.FC<PropsSB> = (parent) => {
    const [open, setOpen] = useState<boolean>(false)

    if (open) {
        return (
            <>
                <i className="fas fa-chevron-down SB-chevron" onClick={() => setOpen(!open)}/>
                {parent.children && Array.isArray(parent.children) ? parent.children?.map((child: any) => {
                    return <div className="SB-Child">{child.title}</div>
                }) : <></>
                }
            </>
        );
    } else {
        return (
            <>
                <i className="fas fa-chevron-down SB-chevron" onClick={() => setOpen(!open)}/>
                {<></>}
            </>
        );
    }
}

const Sidebar = () => {
    const [sidebarOpened, setSidebarOpened] = useState<boolean>(false);

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

    const hasChildren = (item: ISideMenuItems) => {
        const { children } = item;

        if (children === undefined) {
            return false;
        }
        if (children.constructor !== Array) {
            return false;
        }
        return children.length !== 0;

    }


    // FUCKING REACT

    const showContent = (contentItems: ISideMenuItems[]) => {
        return contentItems.map((item: ISideMenuItems) => {
            if (sidebarOpened) {
                if (hasChildren(item)) {
                    return React.createElement(<SingleLevel parent={item} />);
                } else {
                    return React.createElement(<MultiLevel item={item}/>);
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
                            item.children.map((child: ISideMenuItems, index) =>
                                <div key={index} className="SB-Child">{child.title.substring(0,1)}</div>)
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

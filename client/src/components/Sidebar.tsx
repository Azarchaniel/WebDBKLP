import React, {useState} from "react";
import "../styles/font-awesome/css/all.css";
import {ISideMenuItems} from "../type";
import {Link} from "react-router-dom";
import { useLocation } from "react-router-dom";

type PropsSB = {
    parent: ISideMenuItems
}

const hasChildren = (item: ISideMenuItems) => {
	const {children} = item;

	if (children === undefined || children.constructor !== Array) return false;
	return children.length;
}

const MenuItem: React.FC<PropsSB> = ({parent}) => {
	const location = useLocation();

	const [open, setOpen] = useState<boolean>(false)

	if (hasChildren(parent)) {
		//multi item
		if (open) {
			//open
			return (
				<div className="SB-Parent">
					<Link className='customLink' to={parent.route}>{parent.icon ? <i className={parent.icon}>&nbsp;</i> : <></>}
						<span>{parent.title}</span>
					</Link>
                    &nbsp;
					<i className={`fas fa-chevron-${open ? "up" : "down"} SB-chevron`}
						onClick={() => setOpen(!open)}/>
					{parent.children && Array.isArray(parent.children) ? parent.children?.map((child: any, index) => {
						return <div key={index} className="SB-Child">{child.title}</div>
					}) : <></>}
				</div>

			);
		} else {
			//closed
			return (
				<div className="SB-Parent">
					<Link className='customLink' to={parent.route}>
						{parent.icon ? <i className={parent.icon}>&nbsp;</i> : <></>}
						<span>{parent.title}</span>
					</Link>
                    &nbsp;
					<i className={`fas fa-chevron-${open ? "up" : "down"} SB-chevron`}
						onClick={() => setOpen(!open)}/>
				</div>

			);
		}
	} else {
		//single item
		return (
			<div className="SB-Parent">
				<Link className={parent.route === location.pathname ? "customLink activeLink" : "customLink"} to={parent.route}>
					{parent.icon ? <i className={parent.icon}>&nbsp;</i> : <></>}
					<span>{parent.title}</span>
                    &nbsp;
				</Link>
			</div>);
	}
}

const Sidebar = () => {
	const location = useLocation();

	const [sidebarOpened, setSidebarOpened] = useState<boolean>(false);

	//todo: this shouldn't be here - separate data and component
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

	const showContent = (contentItems: ISideMenuItems[]) => {
		return contentItems.map((item: ISideMenuItems, index) => {
			if (sidebarOpened) {
				return <MenuItem key={index} parent={item}/>;
			} else {
				//sidebar closed
				if (!item.children) {
					return <div className="SB-Parent">
						<Link className='customLink' to={item.route}>
							{/* if Menu item has icon, show it. Otherwise show only first letter of title */}
							{item.icon ?
								<i key={index} className={item.route === location.pathname ? 
									item.icon + " customLink activeLink" : item.icon}>&nbsp;</i> : 
								<>{item.title.substring(0, 1)}</>}
						</Link>
					</div>
				} else {
					return <div className="SB-Parent">

						{item.icon ? <Link className='customLink' to={item.route}>
							<i key={index} className={item.icon}>&nbsp;</i>
						</Link> : <></>}
						{
							item.children.map((child: ISideMenuItems, index) =>
								<Link className='customLink' to={child.route}>
									<div key={index} className="SB-Child">{child.title.substring(0, 1)}</div>
								</Link>)
						}

					</div>
				}
			}
		});
	}

	return (
		<div className={sidebarOpened ? "sideBarOpened" : "sideBarClosed"} id='SS'>
			{/* controls icon in the upper right of the Menu */}
			{sidebarOpened ? <span
				className="closeIcon"
				onClick={() => setSidebarOpened(!sidebarOpened)}
			><i className="fas fa-times customLink"/></span> : <span
				className="closeIcon"
				onClick={() => setSidebarOpened(!sidebarOpened)}
			><i className="fas fa-bars customLink"/></span>}
			{showContent(content)} {/* show content of menu - Knihy, Autori etc */}
		</div>
	);
}

export default Sidebar;

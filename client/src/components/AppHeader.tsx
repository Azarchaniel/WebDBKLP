import React from "react";
import {Link} from "react-router-dom";
import LoginModal from "./LoginModal";
import "@styles/header.scss";
import {ActivateUserList} from "./ActivateUserList";

const Header: React.FC = () => {
	return (
		<div className="header" style={{userSelect: "none", msUserSelect: "none"}}>
			<h1><Link className='customLink appHeader' to='/'>WebDBKLP</Link></h1>
			<ActivateUserList />
			<div className="headerLogin">
				<LoginModal />
			</div>
		</div>
	);
}

export default Header;
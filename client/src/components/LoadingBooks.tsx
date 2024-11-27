import "../styles/bookLoading.scss";
import React, {useEffect, useState} from "react";

const LoadingBooks: React.FC = () => {
	const [hidden, setHidden] = useState(true);

	useEffect(() => {
		//delay, so it's not flickering in case of very short loading time
		const timer = setTimeout(() => setHidden(false), 250)
		return () => clearTimeout(timer);
	}, []);

	return (
		<>
			<div className="bookshelf_wrapper" style={{visibility: hidden ? "hidden" : "visible"}}>
				<ul className="books_list">
					<li className="book_item first"/>
					<li className="book_item second"/>
					<li className="book_item third"/>
					<li className="book_item fourth"/>
					<li className="book_item fifth"/>
					<li className="book_item sixth"/>
				</ul>
				<div className="shelf"/>
				<p className="textPatience">Trpezlivosť, prosím...</p>
			</div>
		</>
	)
}

export default LoadingBooks;
import "../styles/bookLoading.scss";
import React from "react";

const LoadingBooks: React.FC = () => {
 return (
     <>
         <div className="bookshelf_wrapper">
             <ul className="books_list">
                 <li className="book_item first"></li>
                 <li className="book_item second"></li>
                 <li className="book_item third"></li>
                 <li className="book_item fourth"></li>
                 <li className="book_item fifth"></li>
                 <li className="book_item sixth"></li>
             </ul>
             <div className="shelf"></div>
             <p className="textPatience">Trpezlivosť, prosím...</p>
         </div>
     </>
 )
}

export default LoadingBooks;
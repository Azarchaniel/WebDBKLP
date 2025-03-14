import Sidebar from "../../components/Sidebar";
import AddQuote from "./AddQuote";
import {IBook, IQuote} from "../../type";
import QuoteItem from "./QuoteItem";
import Toast from "../../components/Toast";
import React, {useEffect, useState} from "react";
import {addQuote, deleteQuote, getQuotes} from "../../API";
import {toast} from "react-toastify";
import {darkenLightenColor, randomMinMax} from "../../utils/utils";
import Header from "../../components/AppHeader";
import { LoadingBooks } from "../../components/LoadingBooks";
import Multiselect from "multiselect-react-dropdown";
import {useReadLocalStorage} from "usehooks-ts";
import {ScrollToTopBtn} from "../../utils/elements";
import {openConfirmDialog} from "../../components/ConfirmDialog";
import {isUserLoggedIn} from "../../utils/user";

export default function QuotePage() {
	const [books, setBooks] = useState<IBook[]>([]);
	const [booksToFilter, setBooksToFilter] = useState<IBook[]>([]);
	const [initQuotes, setInitQuotes] = useState<IQuote[]>([]);
	const [filteredQuotes, setFilteredQuotes] = useState<IQuote[]>([]);
	const [countAll, setCountAll] = useState<number>(0);
	const activeUser = useReadLocalStorage("activeUsers") as string[];
	const [loading, setLoading] = useState(true);
	const [saveAutorSuccess, setSaveAutorSuccess] = useState<boolean | undefined>(undefined);

	const generateColors = (length: number) => {
		let colors = ["#77dd77", "#836953", "#89cff0", "#99c5c4", "#9adedb", "#aa9499", "#aaf0d1", "#b2fba5", "#b39eb5", "#bdb0d0",
			"#bee7a5", "#befd73", "#c1c6fc", "#c6a4a4", "#c8ffb0", "#cb99c9", "#cef0cc", "#cfcfc4", "#d8a1c4", "#dea5a4", "#deece1",
			"#dfd8e1", "#e5d9d3", "#e9d1bf", "#f49ac2", "#f4bfff", "#fdfd96", "#ff6961", "#ff964f", "#ff9899", "#ffb7ce", "#ca9bf7"];

		while (colors.length < length) {
			// if there are more quotes than colors, duplicate arr of colors, but randomly change shade of a color by +- 40 perc
			colors = colors.flatMap((item: string) => [item, darkenLightenColor(item, randomMinMax(30, -30, true))]);
			colors = Array.from(new Set(colors));
		}
		return Array.from(new Set(colors));
	}

	useEffect(() => {
		fetchQuotes();
	}, [activeUser]);

	const colors = React.useMemo(
		() => generateColors(initQuotes.length),
		[initQuotes.length]
	);

	const updateFilteredBooks = (books: IBook[]): void => {
		setBooksToFilter(books);
		fetchQuotes(books.map((book: IBook) => book._id));
	}

	// ### QUOTES ###
	const fetchQuotes = (books?: string[]): void => {
		setLoading(true);

		getQuotes(books, activeUser)
			.then(({data: {quotes, count, onlyQuotedBooks}}: IQuote[] | any) => {
				setInitQuotes(quotes);
				setFilteredQuotes(quotes);
				setCountAll(count);
				setBooks(onlyQuotedBooks);
				console.log(onlyQuotedBooks);
			})
			.catch((err: Error) => console.trace(err))
			.finally(() => setLoading(false))
	}

	const handleSaveQuote = (formData: IQuote): void => {
		addQuote(formData)
			.then(({status}) => {
				if (status !== 201) {
					throw new Error("Citát sa nepodarilo pridať!")
				}
				toast.success("Citát bol úspešne pridaný.");
				setSaveAutorSuccess(true);
			})
			.catch((err) => {
				toast.error("Citát sa nepodarilo pridať!");
				console.trace(err);
				setSaveAutorSuccess(false);
			})
	}

	const handleDeleteQuote = (_id: string): void => {
		openConfirmDialog({
			text: "Naozaj chceš vymazať citát?",
			title: "Vymazať citát?",
			onOk: () => {
				deleteQuote(_id)
					.then(res => {
						if (res.status !== 200) {
							throw new Error("Error! Quote not deleted")
						}
						toast.success("Citát bol úspešne vymazaný.");
					})
					.catch((err) => {
						toast.error("Chyba! Citát nemožno vymazať!");
						console.trace(err);
					});
			},
			onCancel: () => {}
		});
	}

	const scrollToTopOfPage = () => {
		window.scroll(0, 0)
	}

	return (
		<main className='App'>
			<Header/>
			<Sidebar/>
			{isUserLoggedIn() && <AddQuote saveQuote={handleSaveQuote} onClose={() => {}} saveResultSuccess={saveAutorSuccess}/>}
			<div style={{position: "fixed", top: "20rem", zIndex: 1000}}>
				{loading ? <LoadingBooks/> : <></>}
			</div>
			<h6 className="h6MaterialClone">Citáty ({countAll})</h6>
			<Multiselect
				closeOnSelect={true}
				options={books}
				displayValue="title"
				placeholder="Z knih"
				closeIcon="cancel"
				emptyRecordMsg="Žiadne knihy na výber"
				onSelect={updateFilteredBooks}
				onRemove={(remaining) => updateFilteredBooks(remaining)}
				style={{
					inputField: {paddingLeft: "0.5rem"},
					searchBox: {
						width: "20rem",
						paddingRight: "5px",
						borderRadius: "3px"
					},
					option: {
						width: "20rem",
						color: "black"
					},
					notFound: {color: "black"},
					multiselectContainer: {
						width: "20rem",
						paddingRight: "5px",
						marginLeft: ".5rem",
					}
				}}
			/>
			<div className="quote_container">
				{
					filteredQuotes.length ?
						filteredQuotes?.map((quote: IQuote, index: number) => {
							return <QuoteItem
								deleteQuote={handleDeleteQuote}
								saveQuote={handleSaveQuote}
								quote={quote}
								bcgrClr={colors[index]}
							/>
						}) :
						<span style={{color: "black"}}>Žiadne citáty neboli nájdené!</span>
				}
			</div>
			<ScrollToTopBtn scrollToTop={() => scrollToTopOfPage()}/>
			<Toast/>
		</main>
	)
}
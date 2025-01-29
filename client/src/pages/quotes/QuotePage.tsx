import Sidebar from "../../components/Sidebar";
import AddQuote from "./AddQuote";
import {IBook, IQuote, IUser} from "../../type";
import QuoteItem from "./QuoteItem";
import Toast from "../../components/Toast";
import React, {useEffect, useState} from "react";
import {addQuote, deleteQuote, getBooks, getQuotes} from "../../API";
import {toast} from "react-toastify";
import {darkenLightenColor, randomMinMax} from "../../utils/utils";
import Header from "../../components/AppHeader";
import { LoadingBooks } from "../../components/LoadingBooks";
import Multiselect from "multiselect-react-dropdown";
import {useReadLocalStorage} from "usehooks-ts";
import {ScrollToTopBtn} from "../../utils/elements";
import {openConfirmDialog} from "../../components/ConfirmDialog";

export default function QuotePage() {
	const [books, setBooks] = useState<IBook[]>([]);
	const [booksToFilter, setBooksToFilter] = useState<string[]>([]);
	const [initQuotes, setInitQuotes] = useState<IQuote[]>([]);
	const [filteredQuotes, setFilteredQuotes] = useState<IQuote[]>([]);
	const [countAll, setCountAll] = useState<number>(0);
	const activeUser = useReadLocalStorage("activeUsers");
	const [loading, setLoading] = useState(true);

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

	const colors = React.useMemo(
		() => generateColors(initQuotes.length),
		[initQuotes.length]
	);


	useEffect(() => {
		getBooks({ page: 0, pageSize: 10000 })
			.then(({data: {books}}: IBook[] | any) => {
				const quotedBookIds = new Set(initQuotes.map(quote => quote.fromBook?._id));
				//filter only books the quotes are from
				//TODO: do on BE
				setBooks(books.filter((book: IBook) => quotedBookIds.has(book._id)));
			})
			.catch((err: Error) => console.trace(err))
	}, [initQuotes]);

	useEffect(() => {
		fetchQuotes();
	}, [activeUser]);

	// ### QUOTES ###
	const fetchQuotes = (): void => {
		setLoading(true);
		getQuotes()
			.then(({data: {quotes, count}}: IQuote[] | any) => {
				if ((activeUser as string[])?.length) {
					const quotesArr: IQuote[] = [];
					quotes.forEach((qoute: IQuote) => {
						//TODO: this filtering should be on BE
						qoute.owner?.forEach((owner: IUser) => {
							if ((activeUser as string[]).includes(owner._id) || qoute.owner === undefined) {
								quotesArr.push(qoute);
							}
						})
					})
					quotes = quotesArr;
				}
				setInitQuotes(quotes);
				setFilteredQuotes(quotes);
				setCountAll(count);
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
				refresh();
			})
			.catch((err) => {
				toast.error("Citát sa nepodarilo pridať!");
				console.trace(err);
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
						refresh();
					})
					.catch((err) => {
						toast.error("Chyba! Citát nemožno vymazať!");
						console.trace(err);
					})
			},
			onCancel: () => {
			}
		});
	}

	const scrollToTopOfPage = () => {
		window.scroll(0, 0)
	}

	const refresh = () => {
		setInitQuotes([]);
		fetchQuotes();
	}

	const onAddToFilteredBooks = (_: any, added: IBook) => {
		//first param is list already selected Objects
		const updatedBooksToFilter = [...booksToFilter, added._id];

		// Update state with the new array
		setBooksToFilter(updatedBooksToFilter);

		// Use the updated array to filter quotes
		const newFilteredQuotes = filteredQuotes.filter((quote: IQuote) =>
			updatedBooksToFilter.includes(quote.fromBook?._id)
		);

		setFilteredQuotes(newFilteredQuotes);
	}

	const onRemoveFilteredBook = (remaining: IBook[]): void => {
		const remainingIds = remaining.map((book: IBook) => book._id);
		setBooksToFilter(remainingIds);
		if (remainingIds.length === 0) {
			setFilteredQuotes(initQuotes);
		} else {
			const newFilteredQuotes = filteredQuotes.filter((quote: IQuote) =>
				remainingIds.includes(quote.fromBook?._id)
			);
			setFilteredQuotes(newFilteredQuotes);
		}
	}

	return (
		<main className='App'>
			<Header/>
			<Sidebar/>
			<AddQuote key={"new"} saveQuote={handleSaveQuote} onClose={() => {}}/>
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
				onSelect={onAddToFilteredBooks}
				onRemove={onRemoveFilteredBook}
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
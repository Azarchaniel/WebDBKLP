import {IBook, IBookHidden, IUser} from "../../type";
import React, {useEffect, useRef, useState} from "react";
import {addBook, deleteBook, getBook, getBooks} from "../../API";
import {toast} from "react-toastify";
import AddBook from "./AddBook";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import {stringifyAutors, stringifyUsers} from "../../utils/utils";
import Header from "../../components/AppHeader";
import {useReadLocalStorage} from "usehooks-ts";
import {ShowHideRow} from "../../components/books/ShowHideRow";
import {getBookTableColumns} from "../../utils/constants";
import {openConfirmDialog} from "../../components/ConfirmDialog";
import ServerPaginationTable from "../../components/TableSP";
import {SortingState} from "@tanstack/react-table";

export default function BookPage() {
	const [clonedBooks, setClonedBooks] = useState<any[]>([]);
	const [pagination, setPagination] = useState({
		page: 1,
		pageSize: 50,
		search: "",
		sorting: [{
			id: "title",
			desc: false
		}] as SortingState
	});
	const [countAll, setCountAll] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [updateBook, setUpdateBook] = useState<IBook>();
	const [hidden, setHidden] = useState<IBookHidden>({
		control: true,
		editorsFull: false,
		ilustratorsFull: false,
		translatorsFull: true,
		subtitle: false,
		content: true,
		dimensions: false,
		height: false,
		width: false,
		depth: false,
		weight: false,
		edition: false,
		serie: false,
		published: true,
		exLibris: true,
		readBy: true,
		createdAt: true,
		location: true,
		ownersFull: true
	});
	const [saveBookSuccess, setSaveBookSuccess] = useState<boolean | undefined>(undefined);
	const popRef = useRef(null);
	const activeUsers = useReadLocalStorage("activeUsers");

	//fetch books on page init
	useEffect(() => {
		fetchBooks();
	}, [])

	//fetch books when changed user
	useEffect(() => {
		fetchBooks();
	}, [activeUsers]);

	useEffect(() => {
		function handleClickOutside(event: Event) {
			if (popRef.current && !(popRef as any).current.contains(event.target)) {
				//prevState, otherwise it was overwritting the checkboxes
				setHidden(prevState => ({
					...prevState,
					control: true
				}));
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [popRef]);

	// ### BOOKS ###
	const fetchBooks = (): void => {
		try {
			getBooks({...pagination, activeUsers})
				.then(({data: {books, count}}: IBook[] | any) => {
					setCountAll(count);
					books.map((book: any) => book["ownersFull"] = stringifyUsers(book.owner, false))
					setClonedBooks(stringifyAutors(books));
				})
				.catch((err: Error) => console.trace(err))
				.finally(() => setLoading(false))
		} catch (err) {
			console.error('Error fetching books:', err);
		}
	}

	useEffect(() => {
		fetchBooks();
	}, [pagination]);

	const [wasCheckedLoading, setWasCheckedLoading] = useState<boolean>(false);
	const handleSaveBook = (formData: IBook, wasCheckedBox?: boolean): void => {
		if (wasCheckedBox) setWasCheckedLoading(true); //TEMP

		addBook(formData)
			.then(({status, data}) => {
				if (status !== 200) {
					toast.error(`Chyba! Kniha ${data.book?.title} nebola ${formData._id ? "uložená" : "pridaná"}.`)
					throw new Error("Chyba! Kniha nebola pridaná!");
				}
				toast.success(`Kniha ${data.book?.title} bola úspešne ${formData._id ? "uložená" : "pridaná"}.`);
				setSaveBookSuccess(true);
				fetchBooks()
			})
			.catch((err) => {
				console.trace(err)
				setSaveBookSuccess(false);
			})
			.finally(() => setWasCheckedLoading(false)) //TEMP
	}

	const handleUpdateBook = (_id: string): void => {
		setSaveBookSuccess(undefined);
		getBook(_id)
			.then(({data}) => {
				setUpdateBook(data.book);
			})
			.catch((err) => console.trace(err))
	}

	const handleDeleteBook = (_id: string): void => {
		getBook(_id)
			.then(({status, data}) => {
				if (status !== 200) {
					throw new Error("Error! Book not found")
				}

				openConfirmDialog({
					text: `Naozaj chceš vymazať knihu ${data.book?.title}?`,
					title: "Vymazať knihu?",
					onOk: () => {
						deleteBook(_id)
							.then(({status, data}) => {
								if (status !== 200) {
									throw new Error("Error! Book not deleted")
								}
								toast.success(`Kniha ${data.book?.title} bola úspešne vymazaná.`);
								fetchBooks();
							})
							.catch((err) => {
								toast.error("Chyba! Knihu nemožno vymazať!");
								console.trace(err);
							})
					},
					onCancel: () => {}
				});
			})
			.catch((err) => console.trace(err))
	}

	const handlePageSizeChange = (newPageSize: number) => {
		const newPage = Math.floor(((pagination.page - 1) * pagination.pageSize) / newPageSize) + 1;
		setPagination(prevState => ({...prevState, page: newPage, pageSize: newPageSize}));
	};

	return (
		<main className='App'>
			{/* TODO: remove Header and Sidebar from here */}
			<Header/>
			<Sidebar/>
			<AddBook
				saveBook={handleSaveBook}
				onClose={() => setUpdateBook(undefined)}
				saveResultSuccess={saveBookSuccess}
			/>
			<div ref={popRef} className={`showHideColumns ${hidden.control ? "hidden" : "shown"}`}>
				<ShowHideRow label="Editor" init={hidden.editorsFull} onChange={() => setHidden({...hidden, editorsFull: !hidden.editorsFull})} />
				<ShowHideRow label="Prekladateľ" init={hidden.translatorsFull} onChange={() => setHidden({...hidden, translatorsFull: !hidden.translatorsFull})} />
				<ShowHideRow label="Ilustrátor" init={hidden.ilustratorsFull} onChange={() => setHidden({...hidden, ilustratorsFull: !hidden.ilustratorsFull})} />
				<ShowHideRow label="Podnázov" init={hidden.subtitle} onChange={() => setHidden({...hidden, subtitle: !hidden.subtitle})} />
				<ShowHideRow label="Obsah" init={hidden.content} onChange={() => setHidden({...hidden, content: !hidden.content})} />
				<ShowHideRow
					label="Rozmery"
					init={hidden.dimensions}
					onChange={() => setHidden({
						...hidden,
						dimensions: !hidden.dimensions,
						height: !hidden.dimensions,
						width: !hidden.dimensions,
						depth: !hidden.dimensions,
						weight: !hidden.dimensions
					})} />
				<ShowHideRow label="Vydané" init={hidden.published} onChange={() => setHidden({...hidden, published: !hidden.published})} />
				<ShowHideRow label="Edícia" init={hidden.edition} onChange={() => setHidden({...hidden, edition: !hidden.edition})} />
				<ShowHideRow label="Séria" init={hidden.serie} onChange={() => setHidden({...hidden, serie: !hidden.serie})} />
				<ShowHideRow label="Ex Libris" init={hidden.exLibris} onChange={() => setHidden({...hidden, exLibris: !hidden.exLibris})} />
				<ShowHideRow label="Dátum pridania" init={hidden.createdAt} onChange={() => setHidden({...hidden, createdAt: !hidden.createdAt})} />
				<ShowHideRow label="Umiestnenie" init={hidden.location} onChange={() => setHidden({...hidden, location: !hidden.location})} />
				<ShowHideRow label="Majiteľ" init={hidden.ownersFull} onChange={() => setHidden({...hidden, ownersFull: !hidden.ownersFull})} />
			</div>
			<ServerPaginationTable
				title={`Knihy (${countAll})`}
				data={clonedBooks}
				columns={getBookTableColumns()}
				pageChange={(page) => setPagination(prevState => ({...prevState, page: page}))}
				pageSizeChange={handlePageSizeChange}
				sortingChange={(sorting) => setPagination(prevState => ({...prevState, sorting: sorting}))}
				totalCount={countAll}
				loading={loading}
				pagination={pagination}
				hiddenCols={hidden}
				actions={
					<div className="row justify-center mb-4 mr-2">
						<input
							placeholder="Vyhľadaj názov/autora"
							onChange={(e) => setPagination(prevState => ({...prevState, search: e.target.value}))}
						/>
						<i
							className="fas fa-bars bookTableAction ml-4"
							title="Zobraz/skry stĺpce"
							onClick={() => setHidden({...hidden, control: !hidden.control})}
						/>
					</div>
				}
				rowActions={(_id, expandRow) =>
					<div className="actionsRow" style={{pointerEvents: "auto"}}>
						{/* TEMPORARY input*/}
						<input
							type="checkbox"
							title="Zaškrtni, ak sme túto knihu skontrolovali"
							checked={clonedBooks.find((book: IBook) => book._id === _id)?.wasChecked}
							onChange={() => handleSaveBook({
								...clonedBooks.find((book: IBook) => book._id === _id),
								wasChecked: !(clonedBooks.find((book: IBook) => book._id === _id).wasChecked)
							}, true)}
							disabled={wasCheckedLoading}
						/>
						<button
							title="¨Vymazať"
							onClick={() => handleDeleteBook(_id)}
							className="fa fa-trash"
						/>
						<button
							title="Upraviť"
							className="fa fa-pencil-alt"
						   	onClick={() => handleUpdateBook(_id)}
						/>
						<button
							title="Detaily"
							className="fa fa-chevron-down"
							onClick={() => expandRow()}
						/>
					</div>
				}
			/>
			{Boolean(updateBook) &&
				<AddBook
					saveBook={handleSaveBook}
					book={updateBook}
					onClose={() => setUpdateBook(undefined)}
					saveResultSuccess={saveBookSuccess}
				/>}
			<Toast/>
		</main>
	);
}
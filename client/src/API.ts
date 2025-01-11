import axios, {AxiosResponse} from "axios"
import {ApiAutorDataType, ApiBookDataType, ApiLPDataType, ApiQuoteDataType, ApiUserDataType, IBook} from "./type";

const baseUrl: string = "http://localhost:4000"

//### BOOK ###
export const getBooks = async (): Promise<AxiosResponse<ApiBookDataType>> => {
	try {
		const books: AxiosResponse<ApiBookDataType> = await axios.get(
			baseUrl + "/books"
		)
		return books
	} catch (error: any) {
		throw new Error(error)
	}
}

export const getBook = async (
	_id: string
): Promise<AxiosResponse<ApiBookDataType>> => {
	try {
		const book: AxiosResponse<ApiBookDataType> = await axios.get(
			`${baseUrl}/book/${_id}`
		)
		return book
	} catch (error: any) {
		throw new Error(error)
	}
}

export const addBook = async (
	formData: IBook
): Promise<any> => {
	try {
		if (!formData._id) {
			const saveBook: AxiosResponse<ApiBookDataType> = await axios.post(
				baseUrl + "/add-book",
				formData
			)
			return saveBook
		} else {
			const updatedBook: AxiosResponse<ApiBookDataType> = await axios.put(
				`${baseUrl}/edit-book/${formData._id}`,
				formData
			)
			return updatedBook
		}
	} catch (error: any) {
		console.error(error);
		throw new Error(error)
	}
}

export const deleteBook = async (
	_id: string
): Promise<AxiosResponse<ApiBookDataType>> => {
	try {
		const deletedBook: AxiosResponse<ApiBookDataType> = await axios.post(
			`${baseUrl}/delete-book/${_id}`
		)
		return deletedBook
	} catch (error: any) {
		throw new Error(error)
	}
}

//TODO: types
export const getInfoAboutBook = async (isbn: string): Promise<any> => {
	try {
		const bookInfo: AxiosResponse<any> = await axios.get(
			`${baseUrl}/get-book-info/${isbn}`
		)
		console.log(bookInfo)
		return bookInfo
	} catch (error: any) {
		throw new Error(error)
	}
}

// ### AUTOR ###
export const getAutors = async (): Promise<AxiosResponse<ApiAutorDataType>> => {
	try {
		const autors: AxiosResponse<ApiAutorDataType> = await axios.get(
			baseUrl + "/autors"
		)
		return autors
	} catch (error: any) {
		throw new Error(error)
	}
}

export const getAutor = async (
	_id: string
): Promise<AxiosResponse<ApiAutorDataType>> => {
	try {
		const autor: AxiosResponse<ApiAutorDataType> = await axios.get(
			`${baseUrl}/autor/${_id}`
		);

		return autor;
	} catch (error: any) {
		console.error("API ERROR");
		throw new Error(error)
	}
}

export const addAutor = async (
	formData: /*IAutor*/any
): Promise<AxiosResponse<ApiAutorDataType>> => {
	try {
		if (!formData._id) {
			const autor: any/*Omit<IAutor, '_id'>*/ = {
				firstName: formData.firstName ?? "",
				lastName: formData.lastName,
				nationality: formData.nationality ?? "",
				location: formData.location ?? {
					city: "",
					shelf: ""
				},
				note: formData.note ?? "",
				dateOfBirth: formData.dateOfBirth ?? undefined,
				dateOfDeath: formData.dateOfDeath ?? undefined
			}
			return await axios.post(
				baseUrl + "/add-autor",
				autor
			)
		} else {
			return await axios.put(
				`${baseUrl}/edit-autor/${formData._id}`,
				formData
			)
		}
	} catch (error: any) {
		throw new Error(error)
	}
}

export const deleteAutor = async (
	_id: string
): Promise<AxiosResponse<ApiAutorDataType>> => {
	try {
		const deletedAutor: AxiosResponse<ApiAutorDataType> = await axios.post(
			`${baseUrl}/delete-autor/${_id}`
		)
		return deletedAutor
	} catch (error: any) {
		throw new Error(error)
	}
}

// ### QUOTES ###
export const getQuotes = async (): Promise<AxiosResponse<ApiQuoteDataType>> => {
	try {
		const quotes: AxiosResponse<ApiQuoteDataType> = await axios.get(
			baseUrl + "/quotes"
		)
		return quotes
	} catch (error: any) {
		throw new Error(error)
	}
}

export const getQuote = async (
	_id: string
): Promise<AxiosResponse<ApiQuoteDataType>> => {
	try {
		const quote: AxiosResponse<ApiQuoteDataType> = await axios.get(
			`${baseUrl}/quote/${_id}`
		);

		return quote;
	} catch (error: any) {
		throw new Error(error)
	}
}

export const addQuote = async (
	formData: any
): Promise<AxiosResponse<ApiQuoteDataType>> => {
	try {
		const quote: any = {
			id: formData._id,
			text: formData.text,
			fromBook: formData.fromBook,
			pageNo: formData.pageNo ?? null,
			owner: formData.owner ?? [],
			note: formData.note
		}
		const saveQuote: AxiosResponse<ApiQuoteDataType> = await axios.post(
			baseUrl + "/add-quote",
			quote
		)
		return saveQuote
	} catch (error: any) {
		throw new Error(error)
	}
}

export const deleteQuote = async (
	_id: string
): Promise<AxiosResponse<ApiQuoteDataType>> => {
	try {
		const deletedQuote: AxiosResponse<ApiQuoteDataType> = await axios.post(
			`${baseUrl}/delete-quote/${_id}`
		)
		return deletedQuote
	} catch (error: any) {
		throw new Error(error)
	}
}

// ### USER ###
export const getUsers = async (): Promise<AxiosResponse<ApiUserDataType>> => {
	try {
		const users: AxiosResponse<ApiUserDataType> = await axios.get(
			baseUrl + "/users"
		)
		return users
	} catch (error: any) {
		throw new Error(error)
	}
}

export const getUser = async (
	_id: string
): Promise<AxiosResponse<ApiUserDataType>> => {
	try {
		const user: AxiosResponse<ApiUserDataType> = await axios.get(
			`${baseUrl}/user/${_id}`
		);

		return user;
	} catch (error: any) {
		throw new Error(error)
	}
}

// ### LP ###
export const getLPs = async (): Promise<AxiosResponse<ApiLPDataType>> => {
	try {
		const lps: AxiosResponse<ApiLPDataType> = await axios.get(
			baseUrl + "/lps"
		)
		return lps
	} catch (error: any) {
		throw new Error(error)
	}
}

export const getLP = async (
	_id: string
): Promise<AxiosResponse<ApiLPDataType>> => {
	try {
		const lp: AxiosResponse<ApiLPDataType> = await axios.get(
			`${baseUrl}/lp/${_id}`
		);

		return lp;
	} catch (error: any) {
		console.error("API ERROR");
		throw new Error(error)
	}
}

export const addLP = async (
	formData: /*ILP*/any
): Promise<AxiosResponse<ApiLPDataType>> => {
	try {

		const lp: any/*Omit<ILP, '_id'>*/ = {
			...formData,
			published: {
				publisher: formData["published.publisher"] ?? "",
				year: formData["published.year"] ?? undefined,
				country: formData["published.country"] ?? ""
			},
		}
		console.trace(lp);
		const saveLP: AxiosResponse<ApiLPDataType> = await axios.post(
			baseUrl + "/add-lp",
			lp
		)
		return saveLP
	} catch (error: any) {
		throw new Error(error)
	}
}

export const deleteLP = async (
	_id: string
): Promise<AxiosResponse<ApiLPDataType>> => {
	try {
		const deletedAutor: AxiosResponse<ApiLPDataType> = await axios.post(
			`${baseUrl}/delete-lp/${_id}`
		)
		return deletedAutor
	} catch (error: any) {
		throw new Error(error)
	}
}

export const countBooks = async (userId?: string): Promise<AxiosResponse> => {
	try {
		const count: AxiosResponse = await axios.get(
			`${baseUrl}/count-books/${userId}`
		)
		return count;
	} catch (error: any) {
		throw new Error(error);
	}
}

export const getDimensionsStatistics = async (): Promise<AxiosResponse> => {
	try {
		const statistics: AxiosResponse = await axios.get(
			`${baseUrl}/get-dimensions-statistics`,
		)
		return statistics;
	} catch (error: any) {
		throw new Error(error)
	}
}
import axios, { AxiosResponse } from 'axios'
import {ApiAutorDataType, ApiBookDataType, ApiLPDataType, ApiQuoteDataType, ApiUserDataType, IBook} from "./type";

const baseUrl: string = 'http://localhost:4000'

//### BOOK ###
export const getBooks = async (): Promise<AxiosResponse<ApiBookDataType>> => {
  try {
    const books: AxiosResponse<ApiBookDataType> = await axios.get(
      baseUrl + '/books'
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
  formData: /*IBook*/any
): Promise<AxiosResponse<ApiBookDataType>> => {
  try {
    const book: any/*Omit<IBook, '_id'>*/ = {
      ...formData,
      published: {
        publisher: formData['published.publisher'] ?? '',
        year: formData['published.year'] ?? undefined,
        country: formData['published.country'] ?? ''
      },
      location: formData.location

    }
    const saveBook: AxiosResponse<ApiBookDataType> = await axios.post(
      baseUrl + '/add-book',
      book
    )
    return saveBook
  } catch (error: any) {
    throw new Error(error)
  }
}

//todo: fill the form with every data from Book; If _id is filled, it's not adding, but updating;
// Therefore I need Hidden Input field with _id and IF in creating
export const updateBook = async (
  book: IBook
): Promise<AxiosResponse<ApiBookDataType>> => {
  try {
    const bookUpdate: Pick<IBook, 'title'> = {
        title: 'Upravena zatial takto2'
    }
    const updatedBook: AxiosResponse<ApiBookDataType> = await axios.put(
      `${baseUrl}/edit-book/${book._id}`,
      bookUpdate
    )
    return updatedBook
  } catch (error: any) {
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

// ### AUTOR ###
export const getAutors = async (): Promise<AxiosResponse<ApiAutorDataType>> => {
  try {
    const autors: AxiosResponse<ApiAutorDataType> = await axios.get(
        baseUrl + '/autors'
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
    console.error('API ERROR');
    throw new Error(error)
  }
}

export const addAutor = async (
    formData: /*IAutor*/any
): Promise<AxiosResponse<ApiAutorDataType>> => {
  try {
    console.trace('add autor', formData);
    const autor: any/*Omit<IAutor, '_id'>*/ = {
      firstName: formData.firstName ?? '',
      lastName: formData.lastName,
      nationality: formData.nationality ?? '',
      location: formData.location ?? {
        city: '',
        shelf: ''
      },
      note: formData.note ?? '',
      dateOfBirth: formData.dateOfBirth ?? undefined,
      dateOfDeath: formData.dateOfDeath ?? undefined
    }
    console.trace(autor);
    const saveAutor: AxiosResponse<ApiAutorDataType> = await axios.post(
        baseUrl + '/add-autor',
        autor
    )
    return saveAutor
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
        baseUrl + '/quotes'
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
        baseUrl + '/add-quote',
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
        baseUrl + '/users'
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
        baseUrl + '/lps'
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
    console.error('API ERROR');
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
        publisher: formData['published.publisher'] ?? '',
        year: formData['published.year'] ?? undefined,
        country: formData['published.country'] ?? ''
      },
    }
    console.trace(lp);
    const saveLP: AxiosResponse<ApiLPDataType> = await axios.post(
        baseUrl + '/add-lp',
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

export const countBooks = async (userId?: string): Promise<AxiosResponse<{message: string, count: number}>> => {
  try {
    const count: AxiosResponse<{message: string, count: number}> = await axios.get(
      `${baseUrl}/count-books/${userId}`
    )
    return count;
  } catch (error: any) {
    throw new Error(error);
  }
}
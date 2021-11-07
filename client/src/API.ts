import axios, { AxiosResponse } from 'axios'
import {ApiAutorDataType, ApiBookDataType, IBook} from "./type";

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
        title: 'Upravena zatial takto'
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
    const deletedBook: AxiosResponse<ApiBookDataType> = await axios.delete(
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
    const deletedAutor: AxiosResponse<ApiAutorDataType> = await axios.delete(
        `${baseUrl}/delete-autor/${_id}`
    )
    return deletedAutor
  } catch (error: any) {
    throw new Error(error)
  }
}

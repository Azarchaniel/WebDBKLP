import axios, { AxiosResponse } from 'axios'
import {ApiDataType, IBook} from "./type";

const baseUrl: string = 'http://localhost:4000'

export const getBooks = async (): Promise<AxiosResponse<ApiDataType>> => {
  try {
    const books: AxiosResponse<ApiDataType> = await axios.get(
      baseUrl + '/books'
    )
    return books
  } catch (error) {
    throw new Error(error)
  }
}

export const getBook = async (
    _id: string
): Promise<AxiosResponse<ApiDataType>> => {
  try {
    const book: AxiosResponse<ApiDataType> = await axios.get(
        `${baseUrl}/book/${_id}`
    )
    return book
  } catch (error) {
    throw new Error(error)
  }
}

//FIXME: ugly as hell, serialization!
export const addBook = async (
  formData: /*IBook*/any
): Promise<AxiosResponse<ApiDataType>> => {
  try {
    const book: any/*Omit<IBook, '_id'>*/ = {
      title: formData.title,
      subtitle: formData.subtitle,
      ISBN: formData.ISBN,
      language: formData.language,
      note: formData.note,
      numberOfPages: formData.numberOfPages,
      published: {
        publisher: formData['published.publisher'] ?? '',
        year: formData['published.year'] ?? undefined,
        country: formData['published.country'] ?? ''
      },

    }
    const saveBook: AxiosResponse<ApiDataType> = await axios.post(
      baseUrl + '/add-book',
      book
    )
    return saveBook
  } catch (error) {
    throw new Error(error)
  }
}

//todo: fill the form with every data from Book; If _id is filled, it's not adding, but updating;
// Therefore I need Hidden Input field with _id and IF in creating
export const updateBook = async (
  book: IBook
): Promise<AxiosResponse<ApiDataType>> => {
  try {
    const bookUpdate: Pick<IBook, 'title'> = {
        title: 'Upravena zatial takto'
    }
    const updatedBook: AxiosResponse<ApiDataType> = await axios.put(
      `${baseUrl}/edit-book/${book._id}`,
      bookUpdate
    )
    return updatedBook
  } catch (error) {
    throw new Error(error)
  }
}

//todo: Do you really want to delete?
export const deleteBook = async (
  _id: string
): Promise<AxiosResponse<ApiDataType>> => {
  try {
    const deletedBook: AxiosResponse<ApiDataType> = await axios.delete(
      `${baseUrl}/delete-book/${_id}`
    )
    return deletedBook
  } catch (error) {
    throw new Error(error)
  }
}

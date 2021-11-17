import { Document } from 'mongoose'

export interface IEditionSerie extends Document {
    no: number,
    title: string
}
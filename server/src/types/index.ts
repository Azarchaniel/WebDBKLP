export * from './autor';
export * from './book';
export * from './user';
export * from './quote';
export * from './editionSerie';
export * from './lp';
export * from './published';
export * from './location';
export * from './dimension';
export * from './boardGame';

export interface IPopulateOptions {
    path: string,
    model: string,
    populate?: IPopulateOptions,
    select?: string
}
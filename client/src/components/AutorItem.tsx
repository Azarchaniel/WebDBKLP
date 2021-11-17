import React from "react";
import {AutorProps, IAutor} from "../type";
import moment from "moment";

type Props = AutorProps & {
    updateAutor: (autor: IAutor) => void
    deleteAutor: (_id: string) => void
}

const Autor: React.FC<Props> = ({autor, deleteAutor, updateAutor}) => {

    return (
        <div className='Autor'>
            <div className='text'>
                <h1>Meno: {autor.lastName}{autor.firstName ? ', ' + autor.firstName : '-/-'}</h1>
                <p>Narodnost: {autor.nationality}</p>
                <p>Datum narodenia: {autor.dateOfBirth ? moment(autor.dateOfBirth).format('D.M.YYYY') : '-/-'}</p>
                <p>Datum smrti: {autor.dateOfBirth ? moment(autor.dateOfDeath).format('D.M.YYYY') : '-/-'}</p>
                <p>Poznamka: {autor.note}</p>
            </div>
            <div className='Card--button'>
                <button
                    onClick={() => updateAutor(autor)}
                    className='Card--button__done'
                >
                    Editovat
                </button>
                <button
                    onClick={() => deleteAutor(autor._id)}
                    className='Card--button__delete'
                >
                    Zmazat
                </button>
            </div>
        </div>
    )
}

export default Autor

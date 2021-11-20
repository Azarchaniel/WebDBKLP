import React from "react";
import {IAutor, ILP} from "../../type";

type Props = { lp: ILP } & {
    updateLP: (lp: ILP) => void
    deleteLP: (_id: string) => void
}

const LP: React.FC<Props> = ({lp, deleteLP, updateLP}) => {

    return (
        <div className='LP'>
            <div className='text'>
                <h1>Názov: {lp.title}</h1>
                <p>Autor: {lp.autor ? lp.autor.map((autor: IAutor) => `${autor.lastName}, ${autor.firstName}`) : ''}</p>
            </div>
            <div className='Card--button'>
                <button
                    onClick={() => updateLP(lp)}
                    className='Card--button__done'
                >
                    Editovat
                </button>
                <button
                    onClick={() => deleteLP(lp._id)}
                    className='Card--button__delete'
                >
                    Zmazat
                </button>
            </div>
        </div>
    )
}

export default LP

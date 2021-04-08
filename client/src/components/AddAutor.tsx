import React, {useState} from "react";
import {IAutor} from "../../../server/src/types";
import {TextField} from "@material-ui/core";

type Props = {
    saveAutor: (e: React.FormEvent, formData: IAutor | any) => void
}

const AddAutor: React.FC<Props> = ({saveAutor} : {saveAutor : any}) => {
    const [openedNewAutorForm, setOpenedNewAutorForm] = useState<boolean>(false);
    const [formData, setFormData] = useState<IAutor | {}>()

    const handleForm = (e: any): void => {
        setFormData({
            ...formData,
            [e.currentTarget.id]: e.currentTarget.value,
        })
    }

    const handleOpenedAutorForm = () => {
        setOpenedNewAutorForm(!openedNewAutorForm);
    }

    const showAddAutor = () => {
        if (openedNewAutorForm) {
            return (<form id='addForm' className='Form' onSubmit={(e) => {saveAutor(e, formData)}}>
                <div>
                    <div>
                        <label htmlFor='firstName'>Krtne meno</label>
                        <input onChange={handleForm} type='text' id='firstName'/>
                    </div>
                    <div>
                        <label htmlFor='lastName'>Priezvisko</label>
                        <input onChange={handleForm} type='text' id='lastName'/>
                    </div>
                    <div>
                        <label htmlFor='nationality'>Narodnost</label>
                        <input onChange={handleForm} type='text' id='nationality'/>
                    </div>
                    <div>
                        <div>
                            <label htmlFor='dateOfBirth'>Datum narodenia</label>
                            <TextField onChange={handleForm} type='date' id='dateOfBirth'/>
                        </div>
                        <div>
                            <label htmlFor='dateOfDeath'>Datum smrti</label>
                            <TextField onChange={handleForm} type='date' id='dateOfDeath' />
                        </div>
                    </div>
                    <div>
                        <label htmlFor='note'>Poznamka</label>
                        <input onChange={handleForm} type='text' id='note'/>
                    </div>
                </div>
                <button disabled={formData === undefined}>Pridaj autora</button>
                <button onClick={handleOpenedAutorForm}>Skry form</button>
            </form>);
        } else {
            return <form className='Form'><button onClick={handleOpenedAutorForm}>Zobraz form Autor</button></form>;
        }
    }

    return (
        <>
            {showAddAutor()}
        </>
    )
}

export default AddAutor

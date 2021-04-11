import React, {useEffect, useState} from "react";
import {IBook} from "../type";
import {getAutors} from "../API";
import {TextField} from "@material-ui/core";
import {Autocomplete} from "@material-ui/lab";
import {IAutor} from "../../../server/src/types";

type Props = {
    saveBook: (e: React.FormEvent, formData: IBook | any) => void
}

const AddBook: React.FC<Props> = ({saveBook}) => {
    const [openedNewBookForm, setOpenedNewBookForm] = useState<boolean>(false);
    const [formData, setFormData] = useState<IBook | {}>()
    const [autors, setAutors] = useState<IAutor[] | any>();

    //param [] will make useEffect to go only once
    useEffect(() => {
        getAutors()
            .then(autors => {
                setAutors(autors.data.autors)
            })
            .catch(err => console.error('Couldnt fetch autors', err));
    }, [])

    const handleForm = (e: any): void => {
        //console.log(e.currentTarget.value);
        setFormData({
            ...formData,
            [e.currentTarget.id]: e.currentTarget.value,
        })
        console.log(formData);
    }

    const handleOpenedBookForm = () => setOpenedNewBookForm(!openedNewBookForm);

    const showAddBook = () => {
        if (openedNewBookForm) {
            return (<form id='addForm' className='Form' onSubmit={(e) => {
                saveBook(e, formData)
            }}>
                <div>
                    <Autocomplete
                        id={'autor'}
                        multiple
                        options={autors}
                        getOptionLabel={(option: IAutor) => `${option.lastName}, ${option.firstName}`}
                        style={{width: 300}}
                        /*onChange={handleForm}*/
                        onChange={(_event: any, newValue: any) => {
                            console.log(newValue.map((item: IAutor) => item._id));
                            setFormData({...formData, autor: newValue.map((item: IAutor) => item._id)})
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Autor"
                                variant="outlined"
                                id='autor'
                            />
                        )}
                    />
                    <div>
                        <label htmlFor='title'>Nazev</label>
                        <input onChange={handleForm} type='text' id='title'/>
                    </div>
                    <div>
                        <label htmlFor='subtitle'>Podtitul</label>
                        <input onChange={handleForm} type='text' id='subtitle'/>
                    </div>
                    <div>
                        <label htmlFor='ISBN'>ISBN</label>
                        <input onChange={handleForm} type='text' id='ISBN'/>
                    </div>
                    <div>
                        <label htmlFor='language'>Jazyk</label>
                        <input onChange={handleForm} type='text' id='language'/>
                    </div>
                    <div>
                        <label htmlFor='note'>Poznamky</label>
                        <input onChange={handleForm} type='text' id='note'/>
                    </div>
                    <div>
                        <label htmlFor='numberOfPages'>Pocet stran</label>
                        <input onChange={handleForm} type='number' id='numberOfPages'/>
                    </div>
                    <div>
                        <label htmlFor='published.publisher'>Vydavatel</label>
                        <input onChange={handleForm} type='text' id={'published.publisher'}/>
                        <label htmlFor='published.year'>Rok vydania</label>
                        <input onChange={handleForm} type='number' id={'published.year'}/>
                        <label htmlFor='published.country'>Krajina vydania</label>
                        <input onChange={handleForm} type='text' id={'published.country'}/>
                    </div>

                </div>
                <button disabled={formData === undefined}>Add Book</button>
                <button onClick={handleOpenedBookForm}>Skry form</button>
            </form>);
        } else {
            return <form className='Form'>
                <button onClick={handleOpenedBookForm}>Zobraz form</button>
            </form>;
        }
    }

    return (
        <>
            {showAddBook()}
        </>
    )
}

export default AddBook

import {IBook, IUser} from "../../type";
import React from "react";
import {stringifyAutors} from "../../utils/utils";

type Props = {
    data: IBook
}

const BookDetail: React.FC<Props> = ({data}) => {
    const modifData = stringifyAutors(data)[0];

    const showAutorRow = (parameterToCheck: string, parameterToGet: string, singular: string, plural: string) => {
        // @ts-ignore
        if (modifData[parameterToCheck].length < 1) return;
        return <p>{
            // @ts-ignore
            modifData[parameterToCheck] && modifData[parameterToCheck].length > 1 ? singular : plural}
            {// @ts-ignore
                modifData[parameterToGet]
            }</p>
    }

    const returnDimensions = () => {
        if (!data.dimensions) return null;
        const {dimensions} = data;
        return (
            <>
                <p>Rozmery: </p>
                <p className="detailDimensions">Výška: {dimensions.height}</p>
                <p className="detailDimensions">Šírka: {dimensions.width}</p>
                <p className="detailDimensions">Hrúbka: {dimensions.depth}</p>
                {dimensions.weight ? <p className="detailDimensions">Hmotnosť: {dimensions.weight}</p> : null}
            </>
        )
    }

    return (<>
        <div className="row BookDetail">
            <div className="w-25">
                <p>{modifData.picture ? <img src={modifData.picture} alt='titulka'/> :
                    <img src="img/no_thumbnail.svg" alt="no_thumbnail"/>}
                </p>
                <p className="detailHrefs">
                    {data.hrefDatabazeKnih ?
                        <a href={data.hrefDatabazeKnih}>
                            <img src="img/DBKicon.png" width="48" alt="DBK"
                                                             style={{marginLeft: '0.3rem'}}/>
                        </a> : null}
                    {data.hrefGoodReads ?
                        <a href={data.hrefGoodReads}>
                            <img src="https://www.goodreads.com/favicon.ico" alt="GR"
                                                          style={{marginLeft: '0.3rem'}}/>
                        </a> : null}
                </p>
            </div>
            <div className="w-25">
                <h1>{data.title}</h1>
                <h4>{data.subtitle ?? ''}</h4>
                <h3>{showAutorRow('autor', 'autorsFull', 'Autor: ', 'Autori: ')}</h3>
                {showAutorRow('editor', 'editorsFull', 'Editor: ', 'Editori: ')}
                {showAutorRow('ilustrator', 'ilustratorsFull', 'Ilustrátor: ', 'Ilustrátori: ')}
                {showAutorRow('translator', 'ilustratorsFull', 'Prekladateľ: ', 'Prekladatelia: ')}
                {data.language && data.language.length > 0 ?
                    <p>Jazyk: {Array.isArray(data.language) ? data.language.join(', ') : data.language}</p> : null}
                {data.ISBN ? <p>ISBN: {data.ISBN}</p> : null}
                {data.numberOfPages ? <p>Počet strán: {data.numberOfPages}</p> : null}
                {data.published.publisher || data.published.year || data.published.country ?
                    <p>Vydavateľ: {`${data.published.publisher ?? "-"}${", " + data.published.year ?? "-"}${", " + data.published.country ?? ""}`}</p> : null}
                {data.location ?
                    <p>Umiestnenie: {`${data.location.city + ", " ?? "-"}${data.location.shelf ?? ''}`}</p> : null}
                {data.owner && data.owner.length > 0 ?
                    <p>Majiteľ: {data.owner.map((owner: IUser, index) => index > 0 ? owner.firstName : owner.firstName + ", ")}</p> : null}
                {data.readBy && data.readBy.length > 0 ?
                    <p>Prečítané: {data.readBy.map((rb: IUser, index) => index > 0 ? rb.firstName : rb.firstName + ", ")}</p> : null}
                {returnDimensions()}
                {data.note ? <p>Poznámka: {data.note}</p> : null}
                {<p>Ex Libris: {data.exLibris ? <span className="trueMark"/> :
                    <span className="falseMark"/>}</p>}
            </div>
            {/* FULL DATA */}
            {/*<div className="col">*/}
            {/*    <pre>{JSON.stringify(data, undefined, 3)}</pre>*/}
            {/*</div>*/}
        </div>
    </>)
}

export default BookDetail;
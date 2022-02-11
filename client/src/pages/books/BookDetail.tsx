import {IBook, IUser} from "../../type";
import React from "react";
import {stringifyAutors} from "../../utils/utils";

type Props = {
    data: {
        rowData: IBook
    }
}

const BookDetail: React.FC<Props> = ({data}) => {
    const modifData = stringifyAutors(data.rowData)[0];

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
        if (!data.rowData.dimensions) return null;
        const {dimensions} = data.rowData;
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
                    {data.rowData.hrefDatabazeKnih ?
                        <a href={data.rowData.hrefDatabazeKnih}>
                            <img src="img/DBKicon.png" width="48" alt="DBK"
                                                             style={{marginLeft: '0.3rem'}}/>
                        </a> : null}
                    {data.rowData.hrefGoodReads ?
                        <a href={data.rowData.hrefGoodReads}>
                            <img src="https://www.goodreads.com/favicon.ico" alt="GR"
                                                          style={{marginLeft: '0.3rem'}}/>
                        </a> : null}
                </p>
            </div>
            <div className="w-25">
                <h1>{data.rowData.title}</h1>
                <h4>{data.rowData.subtitle ?? ''}</h4>
                <h3>{showAutorRow('autor', 'autorsFull', 'Autor: ', 'Autori: ')}</h3>
                {showAutorRow('editor', 'editorsFull', 'Editor: ', 'Editori: ')}
                {showAutorRow('ilustrator', 'ilustratorsFull', 'Ilustrátor: ', 'Ilustrátori: ')}
                {showAutorRow('translator', 'ilustratorsFull', 'Prekladateľ: ', 'Prekladatelia: ')}
                {data.rowData.language && data.rowData.language.length > 0 ?
                    <p>Jazyk: {Array.isArray(data.rowData.language) ? data.rowData.language.join(', ') : data.rowData.language}</p> : null}
                {data.rowData.ISBN ? <p>ISBN: {data.rowData.ISBN}</p> : null}
                {data.rowData.numberOfPages ? <p>Počet strán: {data.rowData.numberOfPages}</p> : null}
                {data.rowData.published.publisher || data.rowData.published.year || data.rowData.published.country ?
                    <p>Vydavateľ: {`${data.rowData.published.publisher ?? "-"}${", " + data.rowData.published.year ?? "-"}${", " + data.rowData.published.country ?? ""}`}</p> : null}
                {data.rowData.location ?
                    <p>Umiestnenie: {`${data.rowData.location.city + ", " ?? "-"}${data.rowData.location.shelf ?? ''}`}</p> : null}
                {data.rowData.owner && data.rowData.owner.length > 0 ?
                    <p>Majiteľ: {data.rowData.owner.map((owner: IUser, index) => index > 0 ? owner.firstName : owner.firstName + ", ")}</p> : null}
                {data.rowData.readBy && data.rowData.readBy.length > 0 ?
                    <p>Prečítané: {data.rowData.readBy.map((rb: IUser, index) => index > 0 ? rb.firstName : rb.firstName + ", ")}</p> : null}
                {returnDimensions()}
                {data.rowData.note ? <p>Poznámka: {data.rowData.note}</p> : null}
                {<p>Ex Libris: {data.rowData.exLibris ? <span className="trueMark"/> :
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
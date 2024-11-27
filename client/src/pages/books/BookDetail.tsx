import {IUser} from "../../type";
import React from "react";

type Props = {
    data: any
}

const BookDetail: React.FC<Props> = ({data}) => {
	const showAutorRow = (parameterToCheck: string, parameterToGet: string, singular: string, plural: string) => {      
		if (data.rowData[parameterToCheck].length < 1) return;
		return <p>{
			data.rowData[parameterToCheck].length === 1 ? singular : plural}
		{
			data.rowData[parameterToGet]
		}</p>
	}

	const returnDimensions = () => {
		if (!data.rowData.dimensions) return null;
		const {dimensions} = data.rowData;
		return (
			<>
				<p>Rozmery: </p>
				<table className="bookDimensions">
					<tr>
						<td>Výška: {dimensions.height} cm</td>
						<td>Šírka: {dimensions.width} cm</td>
					</tr>
					<tr>
						<td>Hrúbka: {dimensions.depth} cm</td>
						<td>{dimensions.weight ? `Hmotnosť: ${dimensions.weight} g` : null}</td>
					</tr>
				</table>
				<p />
			</>
		)
	}

	return (<>
		<div className="row BookDetail">
			<div className="w-25">
				<p>{data.rowData.picture ? <img src={data.rowData.picture} alt='titulka'/> :
					<img src="img/no_thumbnail.svg" alt="no_thumbnail" style={{maxWidth: "20rem"}}/>}
				</p>
				<p className="detailHrefs">
					{data.rowData.hrefDatabazeKnih ?
						<a href={data.rowData.hrefDatabazeKnih}>
							<img src="img/DBKicon.png" width="32" alt="DBK"
								style={{marginLeft: "0.3rem"}}/>
						</a> : null}
					{data.rowData.hrefGoodReads ?
						<a href={data.rowData.hrefGoodReads}>
							<img src="https://www.goodreads.com/favicon.ico" width="32" alt="GR"
								style={{marginLeft: "0.3rem"}}/>
						</a> : null}
				</p>
			</div>
			<div className="w-25">
				<h1>{data.rowData.title}</h1>
				<h4>{data.rowData.subtitle ?? ""}</h4>
				<h3>{showAutorRow("autor", "autorsFull", "Autor: ", "Autori: ")}</h3>
				{showAutorRow("editor", "editorsFull", "Editor: ", "Editori: ")}
				{showAutorRow("ilustrator", "ilustratorsFull", "Ilustrátor: ", "Ilustrátori: ")}
				{showAutorRow("translator", "translatorsFull", "Prekladateľ: ", "Prekladatelia: ")}
				{data.rowData.language && data.rowData.language.length > 0 ?
					<p>Jazyk: {Array.isArray(data.rowData.language) ? data.rowData.language.join(", ") : data.rowData.language}</p> : null}
				{data.rowData.ISBN ? <p>ISBN: {data.rowData.ISBN}</p> : null}
				{data.rowData.numberOfPages ? <p>Počet strán: {data.rowData.numberOfPages}</p> : null}
				{data.rowData.published.publisher || data.rowData.published.year || data.rowData.published.country ?
					<p>Vydavateľ: {`${data.rowData.published.publisher ?? "-"}${", " + data.rowData.published.year ?? "-"}${", " + data.rowData.published.country ?? ""}`}</p> : null}
				{data.rowData.location ?
					<p>Umiestnenie: {`${data.rowData.location.city + ", " ?? "-"}${data.rowData.location.shelf ?? ""}`}</p> : null}
				{data.rowData.owner && data.rowData.owner.length > 0 ?
					<p>Majiteľ: {data.rowData.owner.map((owner: IUser, index: number) => index > 0 ? owner.firstName : owner.firstName + ", ")}</p> : null}
				{data.rowData.readBy && data.rowData.readBy.length > 0 ?
					<p>Prečítané: {data.rowData.readBy.map((rb: IUser, index: number) => index > 0 ? rb.firstName : rb.firstName + ", ")}</p> : null}
				{returnDimensions()}
				{data.rowData.note ? <p>Poznámka: {data.rowData.note}</p> : null}
				{<p>Ex Libris: {data.rowData.exLibris ? <span className="trueMark"/> :
					<span className="falseMark"/>}</p>}
			</div>
		</div>
	</>)
}

export default BookDetail;
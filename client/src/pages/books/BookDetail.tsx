import {IAutor, IBook, IUser} from "../../type";
import React, {ReactElement} from "react";
import {formatDimension} from "../../utils/utils";

type Props = {
    data: IExtendedBook
}

interface IExtendedBook extends IBook {
	autorsFull?: string | null;
	editorsFull?: string | null;
	ilustratorsFull?: string | null;
	translatorsFull?: string | null;
}

const BookDetail: React.FC<Props> = ({data}) => {
	const showAutorRow = (parameterToCheck: keyof IExtendedBook, parameterToGet: keyof IExtendedBook, singular: string, plural: string): ReactElement => {
		if (!data[parameterToCheck] || !data[parameterToGet]) return <></>;

		else {
			return <p>
				{`${(data[parameterToCheck] as IAutor[]).length === 1 ? singular : plural} ${data[parameterToGet]}`}
			</p>
		}
	}

	const returnDimensions = () => {
		if (!data.dimensions) return null;
		const {dimensions} = data;
		return (
			<>
				<p>Rozmery: </p>
				<table className="bookDimensions">
					<tbody>
					<tr>
						<td>Výška: {formatDimension(dimensions?.height) ?? "-"} cm</td>
						<td>Šírka: {formatDimension(dimensions?.width) ?? "-"} cm</td>
					</tr>
					<tr>
						<td>Hrúbka: {formatDimension(dimensions?.depth) ?? "-"} cm</td>
						<td>{dimensions.weight ? `Hmotnosť: ${formatDimension(dimensions?.weight) ?? "-"} g` : null}</td>
					</tr>
					</tbody>
				</table>
				<p />
			</>
		)
	}

	return (<>
		<div className="row BookDetail">
			<div className="w-25">
				<p>{data.picture ? <img src={data.picture} alt='titulka'/> :
					<img src="img/no_thumbnail.svg" alt="no_thumbnail" style={{maxWidth: "20rem"}}/>}
				</p>
				<p className="detailHrefs">
					{data.hrefDatabazeKnih ?
						<a href={data.hrefDatabazeKnih} target="_blank">
							<img src="img/DBKicon.png" width="32" alt="DBK"
								style={{marginLeft: "0.3rem"}}/>
						</a> : null}
					{data.hrefGoodReads ?
						<a href={data.hrefGoodReads} target="_blank">
							<img src="https://www.goodreads.com/favicon.ico" width="32" alt="GR"
								style={{marginLeft: "0.3rem"}}/>
						</a> : null}
				</p>
			</div>
			<div className="w-25">
				<h1>{data.title}</h1>
				<h4>{data.subtitle ?? ""}</h4>
				<h3>{showAutorRow("autor", "autorsFull", "Autor: ", "Autori: ")}</h3>
				{showAutorRow("editor", "editorsFull", "Editor: ", "Editori: ")}
				{showAutorRow("ilustrator", "ilustratorsFull", "Ilustrátor: ", "Ilustrátori: ")}
				{showAutorRow("translator", "translatorsFull", "Prekladateľ: ", "Prekladatelia: ")}
				{data.language && data.language.length > 0 ?
					<p>Jazyk: {Array.isArray(data.language) ? data.language.join(", ") : data.language}</p> : null}
				{data.ISBN ? <p>ISBN: {data.ISBN}</p> : null}
				{data.numberOfPages ? <p>Počet strán: {data.numberOfPages}</p> : null}
				{data.published.publisher || data.published.year || data.published.country ?
					<p>Vydavateľ: {`${data.published.publisher ?? "-"}${", " + data.published.year ?? "-"}${", " + data.published.country ?? ""}`}</p> : null}
				{data.location ?
					<p>Umiestnenie: {`${data.location.city + ", " ?? "-"}${data.location.shelf ?? ""}`}</p> : null}
				{data.owner && data.owner.length > 0 ?
					<p>Majiteľ: {data.owner.map((owner: IUser, index: number) => index > 0 ? owner.firstName : owner.firstName + ", ")}</p> : null}
				{data.readBy && data.readBy.length > 0 ?
					<p>Prečítané: {data.readBy.map((rb: IUser, index: number) => index > 0 ? rb.firstName : rb.firstName + ", ")}</p> : null}
				{returnDimensions()}
				{data.note ? <p>Poznámka: {data.note}</p> : null}
				{<p>Ex Libris: {data.exLibris ? <span className="trueMark"/> :
					<span className="falseMark"/>}</p>}
			</div>
		</div>
	</>)
}

export default BookDetail;
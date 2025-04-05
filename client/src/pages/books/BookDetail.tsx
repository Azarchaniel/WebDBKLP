import React from "react";
import { IAutor, IBook, ILangCode, IUser } from "../../type";
import {formatDimension, getPublishedCountry} from "../../utils/utils";
import {langCode} from "../../utils/locale";
import { cities } from "../../utils/constants";

interface IExtendedBook extends IBook {
	autorsFull?: string | null;
	editorsFull?: string | null;
	illustratorsFull?: string | null;
	translatorsFull?: string | null;
}

interface Props {
	data: IExtendedBook;
}

const BookDetail: React.FC<Props> = React.memo(({ data }) => {
	// Helper functions
	const renderContributorRow = (
		contributors: keyof IExtendedBook,
		contributorsText: keyof IExtendedBook,
		singularLabel: string,
		pluralLabel: string
	) => {
		if (!data[contributors] || !data[contributorsText]) return null;

		const count = (data[contributors] as IAutor[]).length;
		const label = count === 1 ? singularLabel : pluralLabel;

		return <p>{`${label} ${data[contributorsText]}`}</p>;
	};

	const renderDimensions = () => {
		if (!data.dimensions) return null;

		const { dimensions } = data;

		return (
			<>
				<p>Rozmery: </p>
				<table className="bookDimensions">
					<tbody>
					<tr>
						<td>Výška: {formatDimension(dimensions.height) ?? "-"} cm</td>
						<td>Šírka: {formatDimension(dimensions.width) ?? "-"} cm</td>
					</tr>
					<tr>
						<td>Hrúbka: {formatDimension(dimensions.depth) ?? "-"} cm</td>
						<td>
							{dimensions.weight && `Hmotnosť: ${formatDimension(dimensions.weight) ?? "-"} g`}
						</td>
					</tr>
					</tbody>
				</table>
				<p />
			</>
		);
	};

	const renderLanguage = () => {
		if (!data.language || data.language.length === 0) return null;

		const languageText = Array.isArray(data.language)
			? langCode
				.filter((lang: ILangCode) =>
					(data.language as unknown as string[])?.includes(lang.key)
				)
				.map(l => l.value)
				.join(", ")
			: data.language;

		return <p>Jazyk: {languageText}</p>;
	};

	const renderPublisherInfo = () => {
		const { publisher, year, country } = data.published;

		if (!publisher && !year && !country) return null;

		const publisherText = `${publisher ?? "-"}`;
		const yearText = year ? `, ${year}` : "";
		const countryText = country ? `, ${getPublishedCountry(country)?.value ?? ""}` : "";

		return <p>Vydavateľ: {publisherText}{yearText}{countryText}</p>;
	};

	const renderLocation = () => {
		if (!data.location) return null;

		const cityName = cities
			.filter(c => c.value === data.location?.city)
			.map(c => c.showValue)
			.join(", ");
		const shelf = data.location.shelf ?? "";

		return <p>Umiestnenie: {`${cityName} ${shelf}`}</p>;
	};

	const renderPeopleList = (people: IUser[] | undefined, label: string) => {
		if (!people || people.length === 0) return null;

		const namesList = people.map(person => person.firstName).join(", ");

		return <p>{label}: {namesList}</p>;
	};

	const renderExternalLinks = () => {
		if (!data.hrefDatabazeKnih && !data.hrefGoodReads) return null;

		return (
			<p className="detailHrefs">
				{data.hrefDatabazeKnih && (
					<a href={data.hrefDatabazeKnih} target="_blank" rel="noopener noreferrer">
						<img
							src="img/DBKicon.png"
							width="32"
							alt="DBK"
							style={{ marginLeft: "0.3rem" }}
						/>
					</a>
				)}
				{data.hrefGoodReads && (
					<a href={data.hrefGoodReads} target="_blank" rel="noopener noreferrer">
						<img
							src="https://www.goodreads.com/favicon.ico"
							width="32"
							alt="GR"
							style={{ marginLeft: "0.3rem" }}
						/>
					</a>
				)}
			</p>
		);
	};

	const renderBookCover = () => {
		return (
			<p>
				{data.picture ? (
					<img src={data.picture} alt="titulka" />
				) : (
					<img
						src="img/no_thumbnail.svg"
						alt="no_thumbnail"
						style={{ maxWidth: "20rem" }}
					/>
				)}
			</p>
		);
	};

	// Main render
	return (
		<div className="bookDetailRow">
			<div>
				{renderBookCover()}
				{renderExternalLinks()}
			</div>

			<div>
				<h1>{data.title}</h1>
				{data.subtitle && <h4>{data.subtitle}</h4>}

				<h3>{renderContributorRow("autor", "autorsFull", "Autor: ", "Autori: ")}</h3>
				{renderContributorRow("editor", "editorsFull", "Editor: ", "Editori: ")}
				{renderContributorRow("ilustrator", "illustratorsFull", "Ilustrátor: ", "Ilustrátori: ")}
				{renderContributorRow("translator", "translatorsFull", "Prekladateľ: ", "Prekladatelia: ")}

				{renderLanguage()}
				{data.ISBN && <p>ISBN: {data.ISBN}</p>}
				{data.numberOfPages && <p>Počet strán: {data.numberOfPages}</p>}
				{renderPublisherInfo()}
				{renderLocation()}
				{renderPeopleList(data.owner, "Majiteľ")}
				{renderPeopleList(data.readBy, "Prečítané")}
				{renderDimensions()}
				{data.note && <p>Poznámka: {data.note}</p>}

				<p>
					Ex Libris: {data.exLibris ?
					<span className="trueMark"/> :
					<span className="falseMark"/>
				}
				</p>
			</div>
		</div>
	);
});

export default BookDetail;
import AddAutor from "./AddAutor";
import React, {useEffect, useState} from "react";
import {IAutor} from "../../type";
import {addAutor, deleteAutor, getAutor, getAutors} from "../../API";
import {toast} from "react-toastify";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import MaterialTableCustom from "../../components/MaterialTableCustom";
import {shortenStringKeepWord, stringifyAutors} from "../../utils/utils";
import Header from "../../components/AppHeader";
import {tableHeaderColor} from "../../utils/constants";
import {TooltipedText} from "../../utils/elements";
import {openConfirmDialog} from "../../components/ConfirmDialog";

export default function AutorPage() {
	const [autors, setAutors] = useState<IAutor[]>([]);
	const [countAll, setCountAll] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [updateAutor, setUpdateAutor] = useState<IAutor>();

	useEffect(() => {
		fetchAutors();
	}, [])

	// ### AUTORS ###
	const fetchAutors = (): void => {
		setLoading(true);
		getAutors()
			.then(({data: {autors, count}}: any) => {
				setCountAll(count);
				setAutors(
					autors.filter((autor: IAutor) => !autor.deletedAt)
				);
			})
			.catch((err: Error) => console.trace(err))
			.finally(() => setLoading(false));
	}

	const handleSaveAutor = (formData: IAutor): void => {
		addAutor(formData)
			.then(({status, data}) => {
				if (status !== 201) {
					toast.error(`Chyba! Autor ${data.autor?.lastName} nebol ${formData._id ? "uložený" : "pridaný"}.`)
					throw new Error("Chyba! Kniha nebola pridaná!");
				}
				const autorNames = stringifyAutors({autor: data.autor})[0].autorsFull;

				toast.success(`Autor ${autorNames} bol úspešne ${formData._id ? "uložený" : "pridaný"}.`);
				setAutors(data.autors);
			})
	}

	const handleUpdateAutor = (autor: IAutor): any => {
		setUpdateAutor(autor);
	}

	const handleDeleteAutor = (_id: string): void => {
		getAutor(_id)
			.then(({status, data}) => {
				if (status !== 200) {
					toast.error("Došlo k chybe!");
					throw new Error("Chyba! Autor nebol najdeny.")
				}
				const autorNames = `${data.autor?.lastName}${data.autor?.firstName ? ", " + data.autor?.firstName : ""}`;

				openConfirmDialog({
					title: "Vymazať autora?",
					text: `Naozaj chceš vymazať autora ${autorNames}?`,
					onOk: () => {
						deleteAutor(_id)
							.then(({status, data}) => {
								if (status !== 200) {
									throw new Error("Error! Autor not deleted")
								}
								toast.success(`Autor ${autorNames} bol úspešne vymazaný.`);
								setAutors(data.autors)
							})
							.catch((err) => {
								toast.error("Chyba! Autora nemožno vymazať!");
								console.trace(err);
							})
					},
					onCancel: () => {}
				});
			})
			.catch((err) => console.trace(err))
	}

	return (
		<main className='App'>
			{/* TODO: remove Header and Sidebar from here */}
			<Header/>
			<Sidebar/>
			<AddAutor saveAutor={handleSaveAutor} onClose={() => setUpdateAutor(undefined)}/>
			<MaterialTableCustom
				title={`Autori (${countAll})`}
				loading={loading}
				columns={[
					{
						title: "Meno",
						field: "firstName",
						headerStyle: {
							backgroundColor: tableHeaderColor
						},
					},
					{
						title: "Priezvisko",
						field: "lastName",
						defaultSort: "asc",
						customSort: (a: IAutor, b: IAutor) => a.lastName.localeCompare(b.lastName),
						headerStyle: {
							backgroundColor: tableHeaderColor
						},
						cellStyle: {
							fontWeight: "bold"
						}
					},
					{
						title: "Národnosť",
						field: "nationality",
						headerStyle: {
							backgroundColor: tableHeaderColor
						}
					},
					{
						title: "Narodenie",
						field: "dateOfBirth",
						type: "date",
						dateSetting: {locale: "sk-SK"},
						headerStyle: {
							backgroundColor: tableHeaderColor
						}
					},
					{
						title: "Úmrtie",
						field: "dateOfDeath",
						type: "date",
						dateSetting: {locale: "sk-SK"},
						headerStyle: {
							backgroundColor: tableHeaderColor
						}
					},
					{
						title: "Poznámka",
						field: "note",
						headerStyle: {
							backgroundColor: tableHeaderColor
						},
						render: (rowData: IAutor) => {
							return rowData.note && rowData.note?.length > 30 ? TooltipedText(shortenStringKeepWord(rowData.note, 30), rowData.note) : rowData.note;
						}
					}
				]}
				data={autors}
				actions={[
					{
						icon: "create",
						tooltip: "Upraviť",
						onClick: (_: any, rowData: unknown) => handleUpdateAutor(rowData as IAutor),
					},
					{
						icon: "delete",
						tooltip: "Vymazať",
						onClick: (_: any, rowData: unknown) => handleDeleteAutor((rowData as IAutor)._id),
					}
				]}
				detailPanel={[
					{
						icon: "search",
						tooltip: "Detaily",
						render: (rowData: any) => {
							return (
								<>
									<pre>{JSON.stringify(rowData, undefined, 3)}</pre>
								</>
							)
						}
					},
				]}
			/>
			{Boolean(updateAutor) &&
				<AddAutor
					saveAutor={handleSaveAutor}
					autor={updateAutor}
					onClose={() => setUpdateAutor(undefined)}
				/>}
			<Toast/>
		</main>
	)
}
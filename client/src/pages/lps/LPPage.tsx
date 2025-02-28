import Sidebar from "../../components/Sidebar";
import AddLP from "./AddLP";
import {ILP} from "../../type";
import Toast from "../../components/Toast";
import React, {useEffect, useRef, useState} from "react";
import {addLP, deleteLP, getLPs} from "../../API";
import {toast} from "react-toastify";
import {stringifyAutors} from "../../utils/utils";
import MaterialTableCustom from "../../components/MaterialTableCustom";
import Header from "../../components/AppHeader";
import {tableHeaderColor} from "../../utils/constants";
import {ShowHideRow} from "../../components/books/ShowHideRow";
import {openConfirmDialog} from "../../components/ConfirmDialog";
import {isUserLoggedIn} from "../../utils/user";

export default function LPPage() {
	const [updateLP, setUpdateLP] = useState<ILP>();
	const [LPs, setLPs] = useState<ILP[]>([]);
	const [countAll, setCountAll] = useState<number>(0);
	const [hidden, setHidden] = useState({
		control: true,
		subtitle: true,
		createdAt: true,
		speed: true,
		countLp: true
	});
	const popRef = useRef(null);

	useEffect(() => {
		fetchLPs();
	}, [])

	useEffect(() => {
		//todo: maybe separate to utils
		function handleClickOutside(event: Event) {
			if (popRef.current && !(popRef as any).current.contains(event.target)) {
				//prevState, otherwise it was overwritting the checkboxes
				setHidden(prevState => ({
					...prevState,
					control: true
				}));
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [popRef]);

	// ### QUOTES ###
	const fetchLPs = (): void => {
		getLPs()
			.then(({ data: { lps, count } }: ILP[] | any) => {
				setLPs(stringifyAutors(lps));
				setCountAll(count);
			})
			.catch((err: Error) => console.trace(err))
	}

	const handleSaveLP = (formData: ILP): void => {
		addLP(formData)
			.then(({status, data}) => {
				if (status !== 201) {
					toast.error(`Chyba! LP ${data.lp?.title} nebolo ${formData._id ? "uložené" : "pridané"}.`)
					throw new Error("LP sa nepodarilo pridať!")
				}
				toast.success(`LP ${data.lp?.title} bolo úspešne ${formData._id ? "uložené" : "pridané"}.`);
				setLPs(stringifyAutors(data.lps));
			})
			.catch((err) => {
				toast.error("LP sa nepodarilo pridať!");
				console.trace(err);
			})
	}

	const handleUpdateLP = (lp: ILP): any => {
		setUpdateLP(lp)
	}

	const handleDeleteLP = (_id: string): void => {
		openConfirmDialog({
			title: "Vymazať LP?",
			text: "Naozaj chceš vymazať LP?",
			onOk: () => {
				deleteLP(_id)
					.then(({ status}) => {
						if (status !== 200) {
							throw new Error("Error! LP not deleted")
						}
						toast.success("LP bolo úspešne vymazané.");
						fetchLPs();
					})
					.catch((err) => {
						toast.error("Došlo k chybe!");
						console.trace(err);
					})
			},
			onCancel: () => {}
		});
	}

	return (
		<main className='App'>
			<Header/>
			<Sidebar />
			{isUserLoggedIn() && <AddLP saveLp={handleSaveLP} />}
			<div ref={popRef} className={`showHideColumns ${hidden.control ? "hidden" : "shown"}`}>
				<ShowHideRow label="Podnázov" init={hidden.subtitle} onChange={() => setHidden({...hidden, subtitle: !hidden.subtitle})} />
				<ShowHideRow label="Dátum pridania" init={hidden.createdAt} onChange={() => setHidden({...hidden, createdAt: !hidden.createdAt})} />
				<ShowHideRow label="Rýchlosť" init={hidden.speed} onChange={() => setHidden({...hidden, speed: !hidden.speed})} />
				<ShowHideRow label="Počet LP" init={hidden.countLp} onChange={() => setHidden({...hidden, countLp: !hidden.countLp})} />
			</div>
			<MaterialTableCustom
				title={`LP (${countAll})`}
				pageSizeChange={() => {}}
				pageChange={() => {}}
				totalCount={countAll}
				columns={[
					{
						title: "Autor",
						field: "autorsFull",
						headerStyle: {
							backgroundColor: tableHeaderColor
						},
					},
					{
						title: "Názov",
						field: "title",
						headerStyle: {
							backgroundColor: tableHeaderColor
						},
						cellStyle: {
							fontWeight: "bold"
						}
					},
					{
						title: "Podnázov",
						field: "subtitle",
						headerStyle: {
							backgroundColor: tableHeaderColor
						},
						hidden: hidden.subtitle
					},
					{
						title: "ISBN",
						field: "ISBN",
						headerStyle: {
							backgroundColor: tableHeaderColor
						}
					},
					{
						title: "Jazyk",
						field: "language",
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
					},
					{
						title: "Počet LP",
						field: "countLp",
						headerStyle: {
							backgroundColor: tableHeaderColor
						},
						hidden: hidden.countLp
					},
					{
						title: "Rýchlosť",
						field: "speed",
						headerStyle: {
							backgroundColor: tableHeaderColor
						},
						hidden: hidden.speed
					},
					{
						title: "Pridané",
						field: "createdAt",
						type: "date",
						dateSetting: {locale: "sk-SK"},
						hidden: hidden.createdAt,
						headerStyle: {
							backgroundColor: tableHeaderColor
						}
					}
				]}
				data={LPs}
				actions={isUserLoggedIn() ? [
					{
						icon: "visibility",
						tooltip: "Zobraz/Skry stĺpce",
						onClick: () => {
							setHidden({...hidden, control: !hidden.control})
						},
						isFreeAction: true,
					},
					{
						icon: "create",
						tooltip: "Upraviť",
						onClick: (_: any, rowData: unknown) => handleUpdateLP(rowData as ILP),
					},
					{
						icon: "delete",
						tooltip: "Vymazať",
						onClick: (_: any, rowData: unknown) =>
							handleDeleteLP((rowData as ILP)._id)}
				] : []}
			/>
			{Boolean(updateLP) && <AddLP saveLp={handleSaveLP} lp={updateLP} />}
			<Toast />
		</main>
	)
}
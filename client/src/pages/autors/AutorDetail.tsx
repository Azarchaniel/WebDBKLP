import React, {useEffect, useState} from "react";
import {getAutorInfo} from "../../API";
import {IAutor, IBook} from "../../type";
import {autorRoles} from "../../utils/constants";
import {countryCode} from "../../utils/locale";

type Props = {
    data: any;
}

interface IExtendedAutor extends IAutor {
    books?: IBook[] | null;
}

const AutorDetail: React.FC<Props> = ({data}) => {
    const [autorData, setAutorData] = useState<IExtendedAutor>(data);

    useEffect(() => {
        if (!data) return;

        getAutorInfo(data._id)
            .then((res) => {
                setAutorData({...data, books: (res.data as any).books});
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    return (
        <>
            <div className="row tableDetailRow">
                <div className="col">
                    <table className="autorDetailTable" >
                        <tbody>
                        <tr>
                            <td>Meno:</td>
                            <td>{autorData?.firstName} {autorData?.lastName} <span className="hiddenId">{autorData?._id}</span></td>
                        </tr>
                        <tr>
                            <td>Národnosť:</td>
                            <td>{autorData?.nationality ? countryCode.filter(cc => cc.key === autorData?.nationality).map(cc => cc.value) : "-"}</td>
                        </tr>
                        <tr>
                            <td>Dátum narodenia:</td>
                            <td>{autorData?.dateOfBirth ? new Date(autorData?.dateOfBirth as Date).toLocaleDateString("sk-SK") : "-"}</td>
                        </tr>
                        <tr>
                            <td>Dátum úmrtia:</td>
                            <td>{autorData?.dateOfDeath ? new Date(autorData?.dateOfDeath as Date).toLocaleDateString("sk-SK") : "-"}</td>
                        </tr>
                        <tr>
                            <td>Role:</td>
                            <td>{autorData?.role?.map(role =>
                                autorRoles.find(ar => ar.value === role)?.showValue)
                                .join(", ")}</td>
                        </tr>
                        <tr>
                            <td>Počet kníh:</td>
                            <td>{autorData?.books?.length}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div className="col">
                    <table className="autorDetailTable">
                        <thead>
                        <tr>
                            <th>Názov</th>
                            <th>ISBN</th>
                            <th>Vydané</th>
                        </tr>
                        </thead>
                        <tbody>
                        {autorData?.books?.map((book, index) => (
                            <tr key={index}>
                                <td>{book.title}<span className="hiddenId">{book._id}</span> </td>
                                <td>{book.ISBN}</td>
                                <td>
                                    {book.published?.publisher} ({book.published?.year})
                                </td>
                            </tr>
                        )) ?? (
                            <tr>
                                <td colSpan={3}>No books available</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default AutorDetail;
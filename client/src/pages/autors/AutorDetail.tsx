import React, {useEffect, useState} from "react";
import {getAutorInfo} from "../../API";
import {IBook, ILP} from "../../type";
import {autorRoles} from "../../utils/constants";
import {countryCode} from "../../utils/locale";

type Props = {
    data: any;
}

const AutorDetail: React.FC<Props> = React.memo(({data}) => {
    const [books, setBooks] = useState<IBook[] | null>(null);
    const [lps, setLps] = useState<ILP[] | null>(null);

    useEffect(() => {
        if (!data) return;

        getAutorInfo(data._id, data.role)
            .then((res) => {
                setBooks((res.data as any).books);
                setLps((res.data as any).lps);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [data]);

    return (
        <>
            <div className="row tableDetailRow">
                <div className="col">
                    <table className="autorDetailTable">
                        <tbody>
                        <tr>
                            <td>Meno:</td>
                            <td>{data?.firstName} {data?.lastName} <span className="hiddenId">{data?._id}</span></td>
                        </tr>
                        <tr>
                            <td>Národnosť:</td>
                            <td>{data?.nationality ? countryCode.filter(cc => cc.key === data?.nationality).map(cc => cc.value) : "-"}</td>
                        </tr>
                        <tr>
                            <td>Dátum narodenia:</td>
                            <td>{data?.dateOfBirth ? new Date(data?.dateOfBirth as Date).toLocaleDateString("sk-SK") : "-"}</td>
                        </tr>
                        <tr>
                            <td>Dátum úmrtia:</td>
                            <td>{data?.dateOfDeath ? new Date(data?.dateOfDeath as Date).toLocaleDateString("sk-SK") : "-"}</td>
                        </tr>
                        <tr>
                            <td>Role:</td>
                            <td>{data?.role?.map((role: string) =>
                                autorRoles.find(ar => ar.value === role)?.showValue)
                                .join(", ")}</td>
                        </tr>
                        <tr>
                            <td>Počet kníh:</td>
                            <td>{books?.length}</td>
                        </tr>
                        <tr>
                            <td>Počet LP:</td>
                            <td>{lps?.length}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div className="col">
                    {Boolean(books?.length) && <><h5>Knihy</h5>
                        <table className="autorDetailTable">
                            <thead>
                            <tr>
                                <th>Názov</th>
                                <th>ISBN</th>
                                <th>Vydané</th>
                            </tr>
                            </thead>
                            <tbody>
                            {books?.map((book, index) => (
                                <tr key={index}>
                                    <td>{book.title}<span className="hiddenId">{book._id}</span></td>
                                    <td>{book.ISBN}</td>
                                    <td>
                                        {book.published?.publisher} {book.published?.year ? "(" + book.published?.year + ")" : ""}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </>}

                    {Boolean(lps?.length) && <><h5>LP</h5>
                        <table className="autorDetailTable">
                            <thead>
                            <tr>
                                <th>Názov</th>
                                <th>Vydané</th>
                            </tr>
                            </thead>
                            <tbody>
                            {lps?.map((lp, index) => (
                                <tr key={index}>
                                    <td>{lp.title}<span className="hiddenId">{lp._id}</span></td>
                                    <td>
                                        {lp.published?.publisher} {lp.published?.year ? "(" + lp.published?.year + ")" : ""}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </>}
                </div>
            </div>
        </>
    )
});

export default AutorDetail;
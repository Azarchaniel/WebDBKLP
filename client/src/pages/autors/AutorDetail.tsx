import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAutorInfo } from "../../API";
import { IBook, ILP } from "../../type";
import { AUTOR_ROLES } from "../../utils/constants";
import { countryCode } from "../../utils/locale";
import { useTranslation } from "react-i18next";
import { formatNumberLocale } from "@utils/utils";

type Props = {
    data: any;
}

const AutorDetail: React.FC<Props> = React.memo(({ data }) => {
    const { t } = useTranslation();
    const [books, setBooks] = useState<IBook[] | null>(null);
    const [lps, setLps] = useState<ILP[] | null>(null);

    useEffect(() => {
        if (!data) return;

        getAutorInfo(data._id)
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
            <div className="autorDetail">
                <div>
                    <table className="autorDetailTable">
                        <tbody>
                            <tr>
                                <td>{t("autors.detailName")}:</td>
                                <td>{data?.firstName} {data?.lastName} <span className="hiddenId">{data?._id}</span></td>
                            </tr>
                            <tr>
                                <td>{t("fields.nationality")}:</td>
                                <td>{data?.nationality ? countryCode.filter(cc => cc.key === data?.nationality).map(cc => cc.value) : "-"}</td>
                            </tr>
                            <tr>
                                <td>{t("fields.birthDate")}:</td>
                                <td>{data?.dateOfBirth ? new Date(data?.dateOfBirth as Date).toLocaleDateString(t('common.locale')) : "-"}</td>
                            </tr>
                            <tr>
                                <td>{t("fields.deathDate")}:</td>
                                <td>{data?.dateOfDeath ? new Date(data?.dateOfDeath as Date).toLocaleDateString(t('common.locale')) : "-"}</td>
                            </tr>
                            <tr>
                                <td>{t("common.role")}:</td>
                                <td>{data?.role?.map((role: string) =>
                                    t(AUTOR_ROLES.find(ar => ar.value === role)?.showValue || ""))
                                    .join(", ")}</td>
                            </tr>
                            <tr>
                                <td>{t("autors.detailBookCount")}:</td>
                                <td>{formatNumberLocale(books?.length ?? 0, t('common.locale'), 0)}</td>
                            </tr>
                            <tr>
                                <td>{t("autors.detailLpCount")}:</td>
                                <td>{formatNumberLocale(lps?.length ?? 0, t('common.locale'), 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div>
                    {Boolean(books?.length) && <><h5>{t("nav.books")}</h5>
                        <table className="autorDetailTable">
                            <thead>
                                <tr>
                                    <th>{t("table.books.title")}</th>
                                    <th>{t("table.books.isbn")}</th>
                                    <th>{t("table.books.published")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books?.map((book, index) => (
                                    <tr key={index}>
                                        <td><Link to={`/books/${book._id}`}>{book.title}</Link><span className="hiddenId">{book._id}</span></td>
                                        <td>{book.ISBN}</td>
                                        <td>
                                            {book.published?.publisher} {book.published?.year ? "(" + book.published?.year + ")" : ""}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>}

                    {Boolean(lps?.length) && <><h5>{t("nav.lps")}</h5>
                        <table className="autorDetailTable">
                            <thead>
                                <tr>
                                    <th>{t("table.lp.title")}</th>
                                    <th>{t("table.lp.published")}</th>
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
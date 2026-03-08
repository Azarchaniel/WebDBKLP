import { IBook, ILangCode, ValidationError } from "../../type";
import React, { useCallback, useEffect, useState } from "react";
import { getInfoAboutBook, getUniqueFieldValues } from "../../API";
import { toast } from "react-toastify";
import {
    formatDimension,
    formPersonsFullName,
    validateNumber,
    countryCode,
    langCode,
    cities,
    fetchAutors,
    fetchUsers,
    emptyBook
} from "@utils";
import { ArrayInput, InputField, LazyLoadMultiselect } from "@components/inputs";
import { openLoadingBooks } from "../LoadingBooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import BarcodeScannerButton from "@components/BarcodeScanner";
import { createNewAutor, AutorRole } from "@utils/autor";
import TextArea from "@components/inputs/TextArea";
import { getInputParams } from "@utils/form";
import { useTranslation } from "react-i18next";

interface BodyProps {
    data: IBook[];
    onChange: (data: IBook | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedLP?: IBook;
}

export const BooksModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(
        Array.isArray(data) && data.length > 0
            ? data
            : [emptyBook]
    );
    const [errors, setErrors] = useState<ValidationError[]>([{
        label: t("validation.bookTitleRequired"),
        target: "title"
    }]);
    const [uniqueValues, setUniqueValues] = useState<Record<string, any[]>>({});

    // Fetch unique values on mount
    useEffect(() => {
        getUniqueFieldValues().then(res => {
            setUniqueValues(res.data);
        }).catch(err => {
            console.error('Error fetching unique values:', err);
        });
    }, []);

    // send form data to parent
    useEffect(() => {
        onChange(formData);
    }, [formData]);

    // clear form btn
    useEffect(() => {
        // Only reset formData if data is not empty and different from current formData
        if (data && Array.isArray(data) && data.length > 0 &&
            formData && JSON.stringify(data) !== JSON.stringify(formData)) {
            setFormData(normalizeBookData(data));
        }
    }, [data]);

    //edit book
    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return;

        const modifiedBooks = normalizeBookData(data);
        setFormData(modifiedBooks);
    }, []);

    const getBookFromISBN = () => {
        if (!formData?.[0].ISBN) return;
        if (!("title" in (formData || {})) /*&& checkIsbnValidity(formData?.ISBN)*/) {
            openLoadingBooks(true);
            getInfoAboutBook(formData[0].ISBN)
                .then(({ data, status }) => {
                    if (status !== 200) {
                        throw Error();
                    }

                    setFormData([{
                        ...data,
                        published: {
                            ...data.published,
                            country: countryCode.filter((country: ILangCode) =>
                                ((data as IBook)?.published?.country as unknown as string[])?.includes(country.key))
                        },
                        language: langCode.filter((lang: ILangCode) => ((data as IBook)?.language as unknown as string[])?.includes(lang.key)),
                    } as IBook])
                })
                .catch(err => {
                    toast.error(err.response.data.error);
                    console.error(`Chyba! Kniha ${formData[0].ISBN} nebola nájdená!`, err);
                })
                .finally(() => openLoadingBooks(false))
        }
    }

    const normalizeBookData = (book: any[]): IBook[] => {
        if (!book) return [];
        // Map each book in the array to the modified structure
        return book.filter(Boolean).map((book: IBook): IBook => {
            const readByData = formPersonsFullName(book.readBy);
            const ownerData = formPersonsFullName(book.owner);

            return {
                ...emptyBook,
                ...book,
                location: { city: cities.filter(c => c.value === book?.location?.city) },
                published: {
                    ...book.published,
                    country: countryCode.filter((country: ILangCode) =>
                        (book.published?.country as unknown as string[])?.includes(country.key))
                },
                dimensions: book.dimensions ? {
                    height: (formatDimension(book.dimensions?.height) as any) ?? undefined,
                    width: (formatDimension(book.dimensions?.width) as any) ?? undefined,
                    thickness: (formatDimension(book.dimensions?.thickness) as any) ?? undefined,
                    weight: (formatDimension(book.dimensions?.weight) as any) ?? undefined,
                } : undefined,
                language: langCode.filter((lang: ILangCode) => (book?.language as unknown as string[])?.includes(lang.key)),
                readBy: Array.isArray(readByData) ? readByData : [],
                owner: Array.isArray(ownerData) ? ownerData : [],
                exLibris: book.exLibris,
            };
        });
    }

    //error handling
    useEffect(() => {
        if (!formData) return;

        let localErrors: ValidationError[] = [];

        // Helper to validate a single book object
        const validateBook = (book: any) => {
            let errors: ValidationError[] = [];
            let n1, n2, n3, n4, n5, n6;
            n1 = n2 = n3 = n4 = n5 = n6 = { valid: true, label: "" } as ValidationError;

            const [height, width, thickness, weight] =
                [book.dimensions?.height, book.dimensions?.width, book.dimensions?.thickness, book.dimensions?.weight];

            if (book.dimensions || !(Object.keys(book.dimensions ?? {}).length === 0)) {
                n1 = { valid: validateNumber(height, { mustBePositive: true }), label: t("common.height"), target: "dimensions.height" };
                n2 = { valid: validateNumber(width, { mustBePositive: true }), label: t("common.width"), target: "dimensions.width" };
                n3 = { valid: validateNumber(thickness, { mustBePositive: true }), label: t("common.thickness"), target: "dimensions.thickness" };
                n4 = {
                    valid: validateNumber(weight, { mustBePositive: true }),
                    label: t("common.weight"),
                    target: "dimensions.weight"
                };
            }
            n5 = {
                valid: validateNumber(book.numberOfPages, { mustBeInteger: true, mustBePositive: true }),
                label: t("common.pages"),
                target: "numberOfPages"
            };
            if (book.published || !(Object.keys(book.published ?? {}).length === 0))
                n6 = {
                    valid: validateNumber(book.published?.year, { mustBeInteger: true, mustBePositive: true }),
                    label: t("fields.yearPublished"),
                    target: "published.year"
                };

            const numberValidations = [n1, n2, n3, n4, n5, n6];
            const numberTargets = [
                "dimensions.height",
                "dimensions.width",
                "dimensions.thickness",
                "dimensions.weight",
                "numberOfPages",
                "published.year"
            ];

            if (!("title" in book && book?.title?.trim().length > 0)) {
                errors.push({ label: t("validation.bookTitleRequired"), target: "title" });
            }

            errors = errors?.filter((err: ValidationError) => err.target !== "ISBN") ?? errors;

            if (!(numberValidations.every(n => n?.valid))) {
                numberValidations.filter(n => !(n?.valid))
                    .map((numErr: ValidationError) => ({
                        label: t("validation.numberField", { field: numErr.label }),
                        target: numErr.target || ""
                    }))
                    .forEach(err => errors.push(err));
            } else {
                errors = errors?.filter((err: ValidationError) => !numberTargets.includes(err.target ?? "")) ?? errors;
            }

            return errors;
        };

        if (Array.isArray(formData)) {
            // Merge errors for all books, but only include unique errors by target
            const allErrors = formData.flatMap(validateBook);
            // Optionally, you can group errors by target or show which book has which error
            localErrors = allErrors;
        } else {
            localErrors = validateBook(formData);
        }

        setErrors(localErrors);
        error(localErrors);
    }, [formData]);

    const handleInputChange = useCallback((input: any) => {
        let name: string, value: any;

        if (typeof input === 'object' && "target" in input) {
            const { name: targetName, value: targetValue } = input.target;
            name = targetName;
            value = targetValue;
        } else {
            name = input.name;
            value = input.value;
        }

        setFormData((prevData: any) => {
            const keys = name.split(".");

            // Helper to set nested value
            const setNestedValue = (obj: any, keys: string[], value: any): any => {
                if (keys.length === 0) return value;
                const [first, ...rest] = keys;
                return {
                    ...obj,
                    [first]: setNestedValue(obj?.[first] ?? {}, rest, value)
                };
            };

            // If array, update all items (or you can target specific index if needed)
            if (Array.isArray(prevData)) {
                // If you want to update all items:
                const updatedArray = prevData.map((item: any) => setNestedValue(item, [...keys], value));
                return updatedArray;
            } else {
                // Single object
                return setNestedValue(prevData, [...keys], value);
            }
        });
    }, []);

    const getErrorMsg = (name: string): string => {
        return errors.find(err => err.target === name)?.label || "";
    }

    return (<form>
        <div className="b-container">
            <div className="b-Nazov">
                <InputField
                    placeholder={t("fields.titleRequired")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("title")}
                    {...getInputParams("title", formData, t("fields.titleRequired"))}
                />
            </div>
            <div className="b-Podnazov">
                <InputField
                    placeholder={t("fields.subtitle")}
                    onChange={handleInputChange}
                    {...getInputParams("subtitle", formData, t("fields.subtitle"))}
                />
            </div>
            <div className="b-Autor">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder={t("common.author")}
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={async (autorString) => {
                        await createNewAutor(autorString, AutorRole.AUTOR, setFormData);
                    }}
                    {...getInputParams("autor", formData, t("common.author"))}
                />
            </div>
            <div className="b-ISBN">
                <InputField
                    placeholder={t("table.books.isbn")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("ISBN")}
                    {...getInputParams("ISBN", formData, t("table.books.isbn"))}
                />
                <BarcodeScannerButton
                    onBarcodeDetected={(code) => handleInputChange({ name: "ISBN", value: code })}
                    onError={(error) => console.error(error)}
                />
                <button
                    className="isbnLookup"
                    title={t("books.scanIsbn")}
                    onClick={getBookFromISBN}
                >
                    <FontAwesomeIcon
                        icon={faMagnifyingGlass}
                    />
                </button>
            </div>
            <div className="b-Translator">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder={t("table.books.translator")}
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={async (autorString) => await createNewAutor(autorString, AutorRole.TRANSLATOR, setFormData)}
                    {...getInputParams("translator", formData, t("table.books.translator"))}
                />
            </div>
            <div className="b-Editor">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder={t("table.books.editor")}
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={async (autorString) => await createNewAutor(autorString, AutorRole.EDITOR, setFormData)}
                    {...getInputParams("editor", formData, t("table.books.editor"))}
                />
            </div>
            <div className="b-Ilustrator">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder={t("table.books.illustrator")}
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={async (autorString) => await createNewAutor(autorString, AutorRole.ILUSTRATOR, setFormData)}
                    {...getInputParams("ilustrator", formData, t("table.books.illustrator"))}
                />
            </div>
            <div className="b-Name">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={uniqueValues['edition.title'] || []}
                    value={formData[0]?.edition?.title ? [formData[0].edition.title] : []}
                    onChange={(data) => handleInputChange({ name: 'edition.title', value: data.value[0] || '' })}
                    onNew={(val) => handleInputChange({ name: 'edition.title', value: val })}
                    placeholder={t("fields.editionTitle")}
                    name="edition.title"
                />
            </div>
            <div className="b-No">
                <InputField
                    placeholder={t("fields.editionNumber")}
                    onChange={handleInputChange}
                    {...getInputParams("edition.no", formData, t("fields.editionNumber"))}
                />
            </div>
            <div className="b-NameS">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={uniqueValues['serie.title'] || []}
                    value={formData[0]?.serie?.title ? [formData[0].serie.title] : []}
                    onChange={(data) => handleInputChange({ name: 'serie.title', value: data.value[0] || '' })}
                    onNew={(val) => handleInputChange({ name: 'serie.title', value: val })}
                    placeholder={t("fields.serieTitle")}
                    name="serie.title"
                />
            </div>
            <div className="b-NoS">
                <InputField
                    placeholder={t("fields.serieNumber")}
                    onChange={handleInputChange}
                    {...getInputParams("serie.no", formData, t("fields.serieNumber"))}
                />
            </div>
            <div className="b-Vydavatel">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={uniqueValues['published.publisher'] || []}
                    value={formData[0]?.published?.publisher ? [formData[0].published.publisher] : []}
                    onChange={(data) => handleInputChange({ name: 'published.publisher', value: data.value[0] || '' })}
                    onNew={(val) => handleInputChange({ name: 'published.publisher', value: val })}
                    placeholder={t("common.publisher")}
                    name="published.publisher"
                />
            </div>
            <div className="b-Rok">
                <InputField
                    placeholder={t("fields.yearPublished")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("published.year")}
                    {...getInputParams("published.year", formData, t("fields.yearPublished"))}
                />
            </div>
            <div className="b-Krajina">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={countryCode}
                    displayValue="value"
                    placeholder={t("fields.countryPublished")}
                    onChange={handleInputChange}
                    {...getInputParams("published.country", formData, t("fields.countryPublished"))}
                />
            </div>
            <div className="b-Mesto">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={cities}
                    displayValue="showValue"
                    placeholder={t("fields.city")}
                    onChange={handleInputChange}
                    {...getInputParams("location.city", formData, t("fields.city"))}
                />
            </div>
            <div className="b-Police">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={uniqueValues['location.shelf'] || []}
                    value={formData[0]?.location?.shelf ? [formData[0].location.shelf] : []}
                    onChange={(data) => handleInputChange({ name: 'location.shelf', value: data.value[0] || '' })}
                    onNew={(val) => handleInputChange({ name: 'location.shelf', value: val })}
                    placeholder={t("fields.shelf")}
                    name="location.shelf"
                />
            </div>
            <div className="b-language">
                <LazyLoadMultiselect
                    options={langCode}
                    displayValue="value"
                    placeholder={t("common.language")}
                    onChange={handleInputChange}
                    {...getInputParams("language", formData, t("common.language"))}
                />
            </div>
            <div className="b-Vyska">
                <InputField
                    placeholder={t("dashboard.heightCm")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("dimensions.height")}
                    {...getInputParams("dimensions.height", formData, t("dashboard.heightCm"))}
                />
            </div>
            <div className="b-Sirka">
                <InputField
                    placeholder={t("dashboard.widthCm")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("dimensions.width")}
                    {...getInputParams("dimensions.width", formData, t("dashboard.widthCm"))}
                />
            </div>
            <div className="b-Hrubka">
                <InputField
                    placeholder={t("fields.thicknessCm")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("dimensions.thickness")}
                    {...getInputParams("dimensions.thickness", formData, t("fields.thicknessCm"))}
                />
            </div>
            <div className="b-Hmotnost">
                <InputField
                    placeholder={t("fields.weightG")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("dimensions.weight")}
                    {...getInputParams("dimensions.weight", formData, t("fields.weightG"))}
                />
            </div>
            <div className="b-Page-no">
                <InputField
                    placeholder={t("common.pages")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("numberOfPages")}
                    {...getInputParams("numberOfPages", formData, t("common.pages"))}
                />
            </div>
            <div className="b-Obsah">
                <ArrayInput
                    onChange={handleInputChange}
                    {...getInputParams("content", formData, t("table.books.content"))}
                    placeholder={t("table.books.content")}
                />
            </div>
            <div className="b-Poznamka">
                <TextArea id='note' placeholder={t("common.note")}
                    className="form-control"
                    autoComplete="off"
                    rows={1}
                    onChange={handleInputChange}
                    {...getInputParams("note", formData, t("common.note"))}
                />
            </div>
            <div className="b-Precitane">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder={t("common.readBy")}
                    onChange={handleInputChange}
                    onSearch={fetchUsers}
                    {...getInputParams("readBy", formData, t("common.readBy"))}
                />
            </div>
            <div className="b-Vlastnik">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder={t("common.owner")}
                    onChange={handleInputChange}
                    onSearch={fetchUsers}
                    {...getInputParams("owner", formData, t("common.owner"))}
                />
            </div>
            <div className="b-Ex-Libris">
                <label><input type="checkbox"
                    id="exLibris"
                    className="checkBox"
                    checked={formData?.[0]?.exLibris}
                    onChange={(e) => handleInputChange({ name: "exLibris", value: e.target.checked })}
                />{t("common.exLibris")}</label>
            </div>
            <div className="b-pic">
                <InputField
                    placeholder={t("fields.image")}
                    onChange={handleInputChange}
                    {...getInputParams("picture", formData, t("fields.image"))}
                />
            </div>
            <div className="b-DK">
                <InputField
                    placeholder={t("fields.urlDatabazeKnih")}
                    onChange={handleInputChange}
                    {...getInputParams("hrefDatabazeKnih", formData, t("fields.urlDatabazeKnih"))}
                />
            </div>
            <div className="b-GR">
                <InputField
                    placeholder={t("fields.urlGoodreads")}
                    onChange={handleInputChange}
                    {...getInputParams("hrefGoodReads", formData, t("fields.urlGoodreads"))}
                />
            </div>
        </div>
    </form>)
}


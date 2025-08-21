import { IBook, ILangCode, ValidationError } from "../../type";
import React, { useCallback, useEffect, useState } from "react";
import { getInfoAboutBook } from "../../API";
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

interface BodyProps {
    data: IBook[];
    onChange: (data: IBook | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedLP?: IBook;
}

export const BooksModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const [formData, setFormData] = useState(
        Array.isArray(data) && data.length > 0
            ? data
            : [emptyBook]
    );
    const [errors, setErrors] = useState<ValidationError[]>([{
        label: "Názov knihy musí obsahovať aspoň jeden znak!",
        target: "title"
    }]);

    // send form data to parent
    useEffect(() => {
        onChange(formData);
    }, [formData]);

    // clear form btn
    useEffect(() => {
        if (formData && JSON.stringify(data) !== JSON.stringify(formData)) {
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
        // Map each book in the array to the modified structure
        return book?.map((book: IBook) => ({
            ...emptyBook,
            ...book,
            location: { city: cities.filter(c => c.value === book?.location?.city) },
            published: {
                ...book.published,
                country: countryCode.filter((country: ILangCode) =>
                    (book.published?.country as unknown as string[])?.includes(country.key))
            },
            dimensions: {
                height: formatDimension(book.dimensions?.height) ?? "",
                width: formatDimension(book.dimensions?.width) ?? "",
                depth: formatDimension(book.dimensions?.depth) ?? "",
                weight: formatDimension(book.dimensions?.weight) ?? "",
            },
            language: langCode.filter((lang: ILangCode) => (book?.language as unknown as string[])?.includes(lang.key)),
            readBy: formPersonsFullName(book.readBy),
            owner: formPersonsFullName(book.owner),
            exLibris: book.exLibris,
        }) as IBook);
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

            const [height, width, depth, weight] =
                [book.dimensions?.height, book.dimensions?.width, book.dimensions?.depth, book.dimensions?.weight];

            if (book.dimensions || !(Object.keys(book.dimensions ?? {}).length === 0)) {
                n1 = { valid: validateNumber(height, { mustBePositive: true }), label: "Výška", target: "dimensions.height" };
                n2 = { valid: validateNumber(width, { mustBePositive: true }), label: "Šírka", target: "dimensions.width" };
                n3 = { valid: validateNumber(depth, { mustBePositive: true }), label: "Hrúbka", target: "dimensions.depth" };
                n4 = {
                    valid: validateNumber(weight, { mustBePositive: true }),
                    label: "Hmotnosť",
                    target: "dimensions.weight"
                };
            }
            n5 = {
                valid: validateNumber(book.numberOfPages, { mustBeInteger: true, mustBePositive: true }),
                label: "Počet strán",
                target: "numberOfPages"
            };
            if (book.published || !(Object.keys(book.published ?? {}).length === 0))
                n6 = {
                    valid: validateNumber(book.published?.year, { mustBeInteger: true, mustBePositive: true }),
                    label: "Rok vydania",
                    target: "published.year"
                };

            const numberValidations = [n1, n2, n3, n4, n5, n6];

            if (!("title" in book && book?.title?.trim().length > 0)) {
                errors.push({ label: "Názov knihy musí obsahovať aspoň jeden znak!", target: "title" });
            }

            errors = errors?.filter((err: ValidationError) => err.target !== "ISBN") ?? errors;

            if (!(numberValidations.every(n => n?.valid))) {
                console.log("Nesprávne číslo: ", numberValidations);
                numberValidations.filter(n => !(n?.valid))
                    .map((numErr: ValidationError) => ({
                        label: numErr.label + " musí byť číslo!",
                        target: numErr.target || ""
                    }))
                    .forEach(err => errors.push(err));
            } else {
                errors = errors?.filter((err: ValidationError) => !err.label.includes(" musí byť číslo!")) ?? errors;
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

        if ("target" in input) {
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
                    placeholder='*Názov'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("title")}
                    {...getInputParams("title", formData)}
                />
            </div>
            <div className="b-Podnazov">
                <InputField
                    placeholder='Podnázov'
                    onChange={handleInputChange}
                    {...getInputParams("subtitle", formData)}
                />
            </div>
            <div className="b-Autor">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder="Autor"
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={(autorString) => createNewAutor(autorString, AutorRole.AUTOR, setFormData)}
                    {...getInputParams("autor", formData)}
                />
            </div>
            <div className="b-ISBN">
                <InputField
                    placeholder='ISBN'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("ISBN")}
                    {...getInputParams("ISBN", formData)}
                />
                <BarcodeScannerButton
                    onBarcodeDetected={(code) => setFormData([{ ...formData[0], ISBN: code }])}
                    onError={(error) => console.error(error)}
                />
                <button
                    className="isbnLookup"
                    title="Vyhľadať podľa ISBN"
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
                    placeholder="Prekladateľ"
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={(autorString) => createNewAutor(autorString, AutorRole.TRANSLATOR, setFormData)}
                    {...getInputParams("translator", formData)}
                />
            </div>
            <div className="b-Editor">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder="Editor"
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={(autorString) => createNewAutor(autorString, AutorRole.EDITOR, setFormData)}
                    {...getInputParams("editor", formData)}
                />
            </div>
            <div className="b-Ilustrator">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder="Ilustrátor"
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={(autorString) => createNewAutor(autorString, AutorRole.ILUSTRATOR, setFormData)}
                    {...getInputParams("ilustrator", formData)}
                />
            </div>
            <div className="b-Name">
                <InputField
                    placeholder='Názov edície'
                    onChange={handleInputChange}
                    {...getInputParams("edition.name", formData)}
                />
            </div>
            <div className="b-No">
                <InputField
                    placeholder='Číslo edície'
                    onChange={handleInputChange}
                    {...getInputParams("edition.no", formData)}
                />
            </div>
            <div className="b-NameS">
                <InputField
                    placeholder='Názov série'
                    onChange={handleInputChange}
                    {...getInputParams("serie.title", formData)}
                />
            </div>
            <div className="b-NoS">
                <InputField
                    placeholder='Číslo série'
                    onChange={handleInputChange}
                    {...getInputParams("serie.no", formData)}
                />
            </div>
            <div className="b-Vydavatel">
                <InputField
                    placeholder='Vydavateľ'
                    onChange={handleInputChange}
                    {...getInputParams("published.publisher", formData)}
                />
            </div>
            <div className="b-Rok">
                <InputField
                    placeholder='Rok vydania'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("published.year")}
                    {...getInputParams("published.year", formData)}
                />
            </div>
            <div className="b-Krajina">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={countryCode}
                    displayValue="value"
                    placeholder="Krajina vydania"
                    onChange={handleInputChange}
                    {...getInputParams("published.country", formData)}
                />
            </div>
            <div className="b-Mesto">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={cities}
                    displayValue="showValue"
                    placeholder="Mesto"
                    onChange={handleInputChange}
                    {...getInputParams("location.city", formData)}
                />
            </div>
            <div className="b-Police">
                <InputField
                    placeholder='Polica'
                    onChange={handleInputChange}
                    {...getInputParams("location.shelf", formData)}
                />
            </div>
            <div className="b-language">
                <LazyLoadMultiselect
                    options={langCode}
                    displayValue="value"
                    placeholder="Jazyk"
                    onChange={handleInputChange}
                    {...getInputParams("language", formData)}
                />
            </div>
            <div className="b-Vyska">
                <InputField
                    placeholder='Výška (cm)'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("dimensions.height")}
                    {...getInputParams("dimensions.height", formData)}
                />
            </div>
            <div className="b-Sirka">
                <InputField
                    placeholder='Šírka (cm)'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("dimensions.width")}
                    {...getInputParams("dimensions.width", formData)}
                />
            </div>
            <div className="b-Hrubka">
                <InputField
                    placeholder='Hrúbka (cm)'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("dimensions.depth")}
                    {...getInputParams("dimensions.depth", formData)}
                />
            </div>
            <div className="b-Hmotnost">
                <InputField
                    placeholder='Hmotnosť (g)'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("dimensions.weight")}
                    {...getInputParams("dimensions.weight", formData)}
                />
            </div>
            <div className="b-Page-no">
                <InputField
                    placeholder='Počet strán'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("numberOfPages")}
                    {...getInputParams("numberOfPages", formData)}
                />
            </div>
            <div className="b-Obsah">
                <ArrayInput
                    onChange={handleInputChange}
                    {...getInputParams("content", formData)}
                    placeholder="Obsah"
                />
            </div>
            <div className="b-Poznamka">
                <TextArea id='note' placeholder='Poznámka'
                    className="form-control"
                    autoComplete="off"
                    rows={1}
                    onChange={handleInputChange}
                    {...getInputParams("note", formData)}
                />
            </div>
            <div className="b-Precitane">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder="Prečítané"
                    onChange={handleInputChange}
                    onSearch={fetchUsers}
                    {...getInputParams("readBy", formData)}
                />
            </div>
            <div className="b-Vlastnik">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder="Majiteľ"
                    onChange={handleInputChange}
                    onSearch={fetchUsers}
                    {...getInputParams("owner", formData)}
                />
            </div>
            <div className="b-Ex-Libris">
                <label><input type="checkbox"
                    id="exLibris"
                    className="checkBox"
                    checked={formData?.[0]?.exLibris}
                    onChange={(e) => handleInputChange({ name: "exLibris", value: e.target.checked })}
                />Ex Libris</label>
            </div>
            <div className="b-pic">
                <InputField
                    placeholder='Obrázok'
                    onChange={handleInputChange}
                    {...getInputParams("picture", formData)}
                />
            </div>
            <div className="b-DK">
                <InputField
                    placeholder='URL Databáze knih'
                    onChange={handleInputChange}
                    {...getInputParams("hrefDatabazeKnih", formData)}
                />
            </div>
            <div className="b-GR">
                <InputField
                    placeholder='URL GoodReads'
                    onChange={handleInputChange}
                    {...getInputParams("hrefGoodReads", formData)}
                />
            </div>
        </div>
    </form>)
}
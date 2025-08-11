import React, { useCallback, useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { countryCode, langCode, fetchAutors, formPersonsFullName, getPublishedCountry } from "@utils";
import { ILangCode, ILP, ValidationError } from "../../type";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import "@styles/LpPage.scss";
import { createNewAutor, AutorRole } from "@utils/autor";
import TextArea from "@components/inputs/TextArea";
import { getInputParams } from "@utils/form";

interface BodyProps {
    data: ILP[] | ILP | object;
    onChange: (data: ILP[] | ILP | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedLP?: ILP;
}

export const LPsModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const [formData, setFormData] = useState<ILP[] | ILP | object>(
        Array.isArray(data) && data.length > 0 ? data : data
    );
    const [errors, setErrors] = useState<ValidationError[]>([{
        label: "Názov LP musí obsahovať aspoň jeden znak!",
        target: "title"
    }]);

    useEffect(() => {
        onChange(formData)
    }, [formData]);

    useEffect(() => {
        if (!data) return;
        if (Array.isArray(data) && data.length === 1 && Object.keys(data[0]).length === 0 && data[0].constructor === Object) {
            setFormData(data);
        }
    }, [data]);

    //edit LP
    useEffect(() => {
        if (!data) return;

        if (Array.isArray(data) && data.length > 0) {
            const modifiedLPs = data.map(lp => {
                const country = getPublishedCountry(lp?.published?.country);

                return {
                    ...lp,
                    autor: formPersonsFullName(lp?.autor),
                    published: { ...lp?.published, country: country ? [country] : [] },
                    language: langCode.filter((lang: ILangCode) => (lp?.language as unknown as string[])?.includes(lang.key))
                } as ILP;
            });

            setFormData(modifiedLPs);
        } else if (!Array.isArray(data)) {
            const typedData = data as ILP;
            const country = getPublishedCountry(typedData?.published?.country);

            const toBeModified: ILP = {
                ...typedData,
                autor: formPersonsFullName(typedData?.autor),
                published: { ...typedData?.published, country: country ? [country] : [] },
                language: langCode.filter((lang: ILangCode) => (typedData?.language as unknown as string[])?.includes(lang.key))
            } as ILP;

            setFormData(toBeModified);
        }
    }, []);

    //error handling
    useEffect(() => {
        //if there is no filled field, its disabled
        if (!formData) return;

        let localErrors: ValidationError[] = [];

        if (Array.isArray(formData)) {
            // For multi-edit, we check the first item only
            // Since we're changing all items in the same way
            const firstLP = formData[0] as ILP;

            if (!(firstLP?.title && firstLP.title.trim().length > 0)) {
                localErrors.push({ label: "Názov musí obsahovať aspoň jeden znak!", target: "title" });
            } else {
                localErrors = localErrors?.filter((err: ValidationError) => err.target !== "title") ?? localErrors;
            }
        } else {
            //shortcut
            const data = (formData as unknown as ILP);

            if (!(data?.title && data.title.trim().length > 0)) {
                localErrors.push({ label: "Názov musí obsahovať aspoň jeden znak!", target: "title" });
            } else {
                localErrors = localErrors?.filter((err: ValidationError) => err.target !== "title") ?? localErrors;
            }
        }

        error(localErrors);
        setErrors(localErrors);
    }, [formData])

    const handleInputChange = useCallback((input: any) => {
        let name: string, value: string;

        if ("target" in input) { // if it is a regular event
            const { name: targetName, value: targetValue } = input.target;
            name = targetName;
            value = targetValue;
        } else { // if it is MultiSelect custom answer
            name = input.name;
            value = input.value;
        }

        setFormData((prevData: any) => {
            // Helper function to create a nested object structure
            const setNestedValue = (obj: any, keys: string[], value: any) => {
                const key = keys.shift(); // Get the first key
                if (!key) return value; // If no more keys, return the value
                obj[key] = setNestedValue(obj[key] || {}, keys, value); // Recursively set the nested value
                return obj;
            };

            const keys = name.split("."); // Split name into keys

            if (Array.isArray(prevData)) {
                // Update all items in array (bulk edit pattern)
                return prevData.map(item => {
                    const updatedItem = { ...item };
                    setNestedValue(updatedItem, [...keys], value);
                    return updatedItem;
                });
            } else {
                const updatedData = { ...prevData }; // Clone previous data
                setNestedValue(updatedData, keys, value); // Set nested value
                return updatedData;
            }
        });
    }, []);

    const getErrorMsg = (name: string): string => {
        return errors.find(err => err.target === name)?.label || "";
    }

    return (
        <form className="l-form-grid">
            <div className="l-title">
                <InputField
                    placeholder='*Názov'
                    onChange={handleInputChange}
                    customerror={getErrorMsg("title")}
                    {...getInputParams('title', formData)}
                />
            </div>

            <div className="l-subtitle">
                <InputField
                    placeholder='Podnázov'
                    onChange={handleInputChange}
                    {...getInputParams('subtitle', formData)}
                />
            </div>

            <div className="l-autor">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder="Autor"
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={(autorString) => createNewAutor(autorString, AutorRole.MUSICIAN, setFormData, "autor")}
                    {...getInputParams('autor', formData)}
                />
            </div>

            <div className="l-speed">
                <InputField
                    placeholder='Počet otáčok'
                    onChange={handleInputChange}
                    {...getInputParams('speed', formData)}
                />
            </div>

            <div className="l-countLp">
                <InputField
                    placeholder='Počet platní'
                    onChange={handleInputChange}
                    {...getInputParams('countLp', formData)}
                />
            </div>

            <div className="l-year">
                <InputField
                    placeholder='Rok vydania'
                    onChange={handleInputChange}
                    {...getInputParams('published.year', formData)}
                />
            </div>

            <div className="l-country">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={countryCode}
                    displayValue="value"
                    placeholder="Krajina vydania"
                    onChange={(data) => {
                        if (Array.isArray(formData)) {
                            setFormData(formData.map(item => ({
                                ...item,
                                published: {
                                    ...(item.published || {}),
                                    country: data.value.map(v => (v as any).key)
                                }
                            })));
                        } else {
                            setFormData({
                                ...formData,
                                published: {
                                    ...(formData as any)?.published || {},
                                    country: data.value.map(v => (v as any).key)
                                }
                            });
                        }
                    }}
                    {...getInputParams('published.country', formData)}
                />
            </div>

            <div className="l-publisher">
                <InputField
                    placeholder='Vydavateľ'
                    onChange={handleInputChange}
                    {...getInputParams('published.publisher', formData)}
                />
            </div>

            <div className="l-language">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={countryCode}
                    displayValue="value"
                    placeholder="Jazyk"
                    onChange={handleInputChange}
                    {...getInputParams('language', formData)}
                />
            </div>

            <div className="l-note">
                <TextArea
                    id='note'
                    placeholder='Poznámka'
                    className="form-control"
                    autoComplete="off"
                    rows={1}
                    onChange={handleInputChange}
                    {...getInputParams('note', formData)}
                />
            </div>
        </form>
    );
}
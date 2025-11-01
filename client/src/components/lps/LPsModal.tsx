import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { countryCode, langCode, fetchAutors, formPersonsFullName, getPublishedCountry } from "@utils";
import { ILangCode, ILP, ValidationError } from "../../type";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import "@styles/LpPage.scss";
import { createNewAutor, AutorRole } from "@utils/autor";
import TextArea from "@components/inputs/TextArea";
import { getInputParams } from "@utils/form";

interface BodyProps {
    data: ILP[];
    onChange: (data: ILP[] | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedLP?: ILP;
}


export const LPsModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const [formData, setFormData] = useState(
        Array.isArray(data) && data.length > 0 ? data : [{}]
    );
    const [errors, setErrors] = useState<ValidationError[]>([
        { label: "Názov LP musí obsahovať aspoň jeden znak!", target: "title" }
    ]);

    // Normalize LP data (like BookModal)
    const normalizeLPData = (lpArr: any[]): ILP[] => {
        return (Array.isArray(lpArr) ? lpArr : [lpArr]).map(lp => {
            const country = getPublishedCountry(lp?.published?.country);
            return {
                ...lp,
                autor: formPersonsFullName(lp?.autor),
                published: { ...lp?.published, country: country ? [country] : [] },
                language: langCode.filter((lang: ILangCode) => (lp?.language as unknown as string[])?.includes(lang.key))
            } as ILP;
        });
    };

    // Unified input change handler (like BookModal)
    const handleInputChange = (input: any) => {
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
            if (Array.isArray(prevData)) {
                // Update all items (or target specific index if needed)
                const updatedArray = prevData.map((item: any) => setNestedValue(item, [...keys], value));
                return updatedArray;
            } else {
                return setNestedValue(prevData, [...keys], value);
            }
        });
    };

    // Send form data to parent
    useEffect(() => {
        onChange(formData);
    }, [formData]);

    // Reset formData if incoming data changes (like BookModal)
    useEffect(() => {
        if (data && Array.isArray(data) && data.length > 0 && JSON.stringify(data) !== JSON.stringify(formData)) {
            setFormData(normalizeLPData(data));
        }
    }, [data]);

    // Error handling (like BookModal)
    useEffect(() => {
        if (!formData) return;
        let localErrors: ValidationError[] = [];
        const validateLP = (lp: ILP) => {
            let errors: ValidationError[] = [];
            if (!(lp?.title && lp.title.trim().length > 0)) {
                errors.push({ label: "Názov LP musí obsahovať aspoň jeden znak!", target: "title" });
            } else {
                errors = errors?.filter((err: ValidationError) => err.target !== "title") ?? errors;
            }
            return errors;
        };
        if (Array.isArray(formData)) {
            const allErrors = (formData as ILP[]).flatMap(validateLP);
            localErrors = allErrors;
        } else {
            localErrors = validateLP(formData as ILP);
        }
        setErrors(localErrors);
        error(localErrors);
    }, [formData]);

    const getErrorMsg = (name: string): string => {
        return errors.find(err => err.target === name)?.label || "";
    };

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
                    onChange={handleInputChange}
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
                    options={langCode}
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
};
import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { countryCode, langCode, fetchAutors, formPersonsFullName, getPublishedCountry } from "@utils";
import { ILangCode, ILP, ValidationError } from "../../type";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import "@styles/LpPage.scss";
import { createNewAutor, AutorRole } from "@utils/autor";
import TextArea from "@components/inputs/TextArea";
import { getInputParams } from "@utils/form";
import { useTranslation } from "react-i18next";

interface BodyProps {
    data: ILP[];
    onChange: (data: ILP[] | object) => void;
    error: (err: ValidationError[] | undefined) => void;
    editedLP?: ILP;
}


export const LPsModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(
        Array.isArray(data) && data.length > 0 ? data : [{}]
    );
    const [errors, setErrors] = useState<ValidationError[]>([
        { label: t("validation.lpTitleRequired"), target: "title" }
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

    // Normalize on mount (formData is initialized as raw data, so [data] guard above won't fire)
    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        setFormData(normalizeLPData(data));
    }, []);

    // Error handling (like BookModal)
    useEffect(() => {
        if (!formData) return;
        let localErrors: ValidationError[] = [];
        const validateLP = (lp: ILP) => {
            let errors: ValidationError[] = [];
            if (!(lp?.title && lp.title.trim().length > 0)) {
                errors.push({ label: t("validation.lpTitleRequired"), target: "title" });
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
                    placeholder={t("fields.titleRequired")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("title")}
                    {...getInputParams('title', formData, t("fields.titleRequired"))}
                />
            </div>
            <div className="l-subtitle">
                <InputField
                    placeholder={t("fields.subtitle")}
                    onChange={handleInputChange}
                    {...getInputParams('subtitle', formData, t("fields.subtitle"))}
                />
            </div>
            <div className="l-autor">
                <LazyLoadMultiselect
                    displayValue="fullName"
                    placeholder={t("common.author")}
                    onChange={handleInputChange}
                    onSearch={fetchAutors}
                    onNew={(autorString) => createNewAutor(autorString, AutorRole.MUSICIAN, setFormData, "autor")}
                    {...getInputParams('autor', formData, t("common.author"))}
                />
            </div>
            <div className="l-speed">
                <InputField
                    placeholder={t("fields.speed")}
                    onChange={handleInputChange}
                    {...getInputParams('speed', formData, t("fields.speed"))}
                />
            </div>
            <div className="l-countLp">
                <InputField
                    placeholder={t("fields.countLp")}
                    onChange={handleInputChange}
                    {...getInputParams('countLp', formData, t("fields.countLp"))}
                />
            </div>
            <div className="l-year">
                <InputField
                    placeholder={t("fields.yearPublished")}
                    onChange={handleInputChange}
                    {...getInputParams('published.year', formData, t("fields.yearPublished"))}
                />
            </div>
            <div className="l-country">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={countryCode}
                    displayValue="value"
                    placeholder={t("fields.countryPublished")}
                    onChange={handleInputChange}
                    {...getInputParams('published.country', formData, t("fields.countryPublished"))}
                />
            </div>
            <div className="l-publisher">
                <InputField
                    placeholder={t("common.publisher")}
                    onChange={handleInputChange}
                    {...getInputParams('published.publisher', formData, t("common.publisher"))}
                />
            </div>
            <div className="l-language">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={langCode}
                    displayValue="value"
                    placeholder={t("common.language")}
                    onChange={handleInputChange}
                    {...getInputParams('language', formData, t("common.language"))}
                />
            </div>
            <div className="l-note">
                <TextArea
                    id='note'
                    placeholder={t("common.note")}
                    className="form-control"
                    autoComplete="off"
                    rows={1}
                    onChange={handleInputChange}
                    {...getInputParams('note', formData, t("common.note"))}
                />
            </div>
        </form>
    );
};
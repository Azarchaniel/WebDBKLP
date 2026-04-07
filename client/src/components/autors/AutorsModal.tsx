import React, { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { countryCode, AUTOR_ROLES, EMPTY_AUTOR } from "@utils";
import { IAutor, ILangCode, ValidationError } from "../../type";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import { sk } from "date-fns/locale/sk";
import TextArea from "@components/inputs/TextArea";
import { getInputParams } from "@utils/form";
import { useTranslation } from "react-i18next";

registerLocale('sk', sk)

interface BodyProps {
    data: IAutor[];
    onChange: (data: IAutor[] | object) => void;
    error: (err: ValidationError[] | undefined) => void;
}

export const AutorsModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(
        Array.isArray(data) && data.length > 0 ? data : [EMPTY_AUTOR]
    );
    const [errors, setErrors] = useState<ValidationError[]>([
        { label: t("validation.authorLastNameRequired"), target: "lastName" }
    ]);

    // Normalize autor data (like BookModal)
    const normalizeAutorData = (autor: any[]): IAutor[] => {
        return (Array.isArray(autor) ? autor : [autor]).map(item => {
            if (!item) return EMPTY_AUTOR;
            let role: any[] = [];
            if ("role" in item) {
                role = AUTOR_ROLES
                    .filter(obj => (item?.role as string[]).includes(obj?.value))
                    .map(obj => ({ ...obj, showValue: t(obj.showValue) }));
            } else {
                role = [];
            }
            const modified: IAutor = {
                ...item,
                nationality: countryCode.filter((country: ILangCode) => item?.nationality?.includes(country.key)),
                role: role,
                dateOfBirth: item?.dateOfBirth ? new Date(item?.dateOfBirth as string | number | Date) : undefined,
                dateOfDeath: item?.dateOfDeath ? new Date(item?.dateOfDeath as string | number | Date) : undefined
            } as IAutor;
            return {
                ...EMPTY_AUTOR,
                ...item,
                ...modified
            };
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
            setFormData(normalizeAutorData(data));
        }
    }, [data]);

    // Normalize on mount (formData is initialized as raw data, so [data] guard above won't fire)
    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        setFormData(normalizeAutorData(data));
    }, []);

    // Error handling (like BookModal)
    useEffect(() => {
        if (!formData) return;
        let localErrors: ValidationError[] = [];
        const validateAutor = (data: IAutor) => {
            let errors: ValidationError[] = [];
            const autorsLastNameLength = data.lastName?.trim().length > 0;
            if (!autorsLastNameLength) {
                errors.push({ label: t("validation.authorLastNameRequired"), target: "lastName" });
            } else {
                errors = errors?.filter((err: ValidationError) => err.target !== "lastName") ?? errors;
            }
            if (data.dateOfBirth && data.dateOfDeath) {
                const dates = data.dateOfBirth! < data.dateOfDeath!;
                if (!dates) {
                    errors.push({ label: t("validation.dateOrderInvalid"), target: "dateOfDeath" });
                } else {
                    errors = errors?.filter((err: ValidationError) => err.target !== "dateOfDeath") ?? errors;
                }
            }
            return errors;
        };
        if (Array.isArray(formData)) {
            const allErrors = formData.flatMap(validateAutor);
            localErrors = allErrors;
        } else {
            localErrors = validateAutor(formData);
        }
        setErrors(localErrors);
        error(localErrors);
    }, [formData]);

    const getErrorMsg = (name: string): string => {
        return errors.find(err => err.target === name)?.label || "";
    };

    const isValidDate = (varToCheck: unknown) => {
        return varToCheck instanceof Date && !isNaN(varToCheck.valueOf());
    };

    return (
        <form>
            <div className="a-first-name">
                <InputField
                    placeholder='Krstné meno'
                    onChange={handleInputChange}
                    {...getInputParams("firstName", formData, t("fields.firstName"))}
                />
            </div>
            <div className="a-last-name">
                <InputField
                    placeholder={t("fields.lastNameRequired")}
                    onChange={handleInputChange}
                    customerror={getErrorMsg("lastName")}
                    {...getInputParams("lastName", formData, t("fields.lastNameRequired"))}
                />
            </div>
            <div className="a-birth-date a-date-picker-container">
                <DatePicker
                    className="form-control"
                    id='dateOfBirth'
                    selected={
                        getInputParams("dateOfBirth", formData).value ?
                            new Date(getInputParams("dateOfBirth", formData).value as string | number | Date) :
                            undefined
                    }
                    onChange={(dateOfBirth: any) => setFormData(formData.map((item: IAutor) => ({
                        ...item,
                        dateOfBirth
                    })))}
                    onSelect={(dateOfBirth: any) => setFormData(formData.map((item: IAutor) => ({
                        ...item,
                        dateOfBirth
                    })))}
                    locale="sk"
                    dateFormat='dd.MM.yyyy'
                    placeholderText={getInputParams("dateOfBirth", formData, t("fields.birthDate")).placeholder}
                    maxDate={new Date()}
                    autoComplete="off"
                />
                {isValidDate(formData && "dateOfBirth" in formData ? formData?.dateOfBirth : false) ?
                    <button className='clearInput' type="button" onClick={() => {
                        setFormData(formData.map((item: IAutor) => ({
                            ...item,
                            dateOfBirth: undefined
                        })));
                    }}>&#10006;
                    </button> : <></>}
            </div>
            <div className="a-death-date a-date-picker-container">
                <DatePicker
                    className="form-control"
                    id='dateOfDeath'
                    selected={getInputParams("dateOfDeath", formData).value ? new Date(getInputParams("dateOfDeath", formData).value as string | number | Date) : undefined}
                    onChange={(dateOfDeath: any) => setFormData(formData.map((item: IAutor) => ({
                        ...item,
                        dateOfDeath
                    })))}
                    onSelect={(dateOfDeath: any) => setFormData(formData.map((item: IAutor) => ({
                        ...item,
                        dateOfDeath
                    })))}
                    locale="sk"
                    dateFormat='dd.MM.yyyy'
                    placeholderText={getInputParams("dateOfDeath", formData, t("fields.deathDate")).placeholder}
                    maxDate={new Date()}
                    autoComplete="off"
                />
                {isValidDate(formData && "dateOfDeath" in formData ? formData?.dateOfDeath : false) ?
                    <button className='clearInput' type="button" onClick={() => {
                        setFormData(formData.map((item: IAutor) => ({
                            ...item,
                            dateOfDeath: undefined
                        })));
                    }}>&#10006;
                    </button> : <></>}
            </div>
            <div className="a-nationality">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={countryCode}
                    displayValue="value"
                    placeholder={t("fields.nationality")}
                    onChange={handleInputChange}
                    {...getInputParams("nationality", formData, t("fields.nationality"))}
                />
            </div>
            <div className="a-role">
                <LazyLoadMultiselect
                    options={AUTOR_ROLES.map(role => ({ ...role, showValue: t(role.showValue) }))}
                    displayValue="showValue"
                    placeholder={t("common.role")}
                    onChange={handleInputChange}
                    {...getInputParams("role", formData, t("common.role"))}
                />
            </div>
            <div className="a-note">
                <TextArea
                    id='note'
                    placeholder={t("common.note")}
                    className="form-control"
                    autoComplete="off"
                    rows={1}
                    onChange={handleInputChange}
                    {...getInputParams("note", formData, t("common.note"))}
                />
            </div>
        </form>
    );
};
import React, { useCallback, useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { countryCode, autorRoles, emptyAutor } from "@utils";
import { IAutor, ILangCode, ValidationError } from "../../type";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import { sk } from "date-fns/locale/sk";
import TextArea from "@components/inputs/TextArea";
import { getInputParams, handleInputChange } from "@utils/form";

registerLocale('sk', sk)

interface BodyProps {
    data: IAutor[];
    onChange: (data: IAutor[] | object) => void;
    error: (err: ValidationError[] | undefined) => void;
}

export const AutorsModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const [formData, setFormData] = useState(
        Array.isArray(data) && data.length > 0
            ? data
            : [emptyAutor]
    );
    const [errors, setErrors] = useState<ValidationError[]>(
        [{ label: "Priezvisko autora musí obsahovať aspoň jeden znak!", target: "lastName" }]);

    // send form data to parent
    useEffect(() => {
        onChange(formData);
    }, [formData]);

    // clear form btn
    useEffect(() => {
        if (formData && JSON.stringify(data) !== JSON.stringify(formData)) {
            setFormData(normalizeAutorData(data));
        }
    }, [data]);

    // edit autor
    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return;

        const modifiedAutors = normalizeAutorData(data);
        setFormData(modifiedAutors);
    }, []);

    // error handling
    useEffect(() => {
        if (!formData) return;

        let localErrors: ValidationError[] = [];

        const validateAutor = (data: IAutor) => {
            let errors: ValidationError[] = [];
            //if length is over 0, its OK
            const autorsLastNameLength = data.lastName?.trim().length > 0;
            if (!autorsLastNameLength) {
                errors.push({ label: "Priezvisko autora musí obsahovať aspoň jeden znak!", target: "lastName" });
            } else {
                errors = errors?.filter((err: ValidationError) => err.target !== "lastName") ?? errors;
            }

            if (data.dateOfBirth && data.dateOfDeath) {
                //if dateOfBirth is sooner, its OK
                const dates = data.dateOfBirth! < data.dateOfDeath!;

                if (!dates) {
                    errors.push({ label: "Dátum smrti nemôže byť skôr, než dátum narodenia!", target: "dateOfDeath" });
                } else {
                    errors = errors?.filter((err: ValidationError) => err.target !== "dateOfDeath") ?? errors;
                }
            }

            return errors;
        }

        if (Array.isArray(formData)) {
            // Merge errors for all books, but only include unique errors by target
            const allErrors = formData.flatMap(validateAutor);
            // Optionally, you can group errors by target or show which book has which error
            localErrors = allErrors;
        } else {
            localErrors = validateAutor(formData);
        }

        setErrors(localErrors);
        error(localErrors);
    }, [formData]);

    const normalizeAutorData = (autor: any[]): IAutor[] => {
        return (Array.isArray(autor) ? autor : [autor]).map(item => {
            if (!item) return emptyAutor;

            let role: any[] = [];
            if ("role" in item) {
                role = autorRoles.filter(obj => (item?.role as string[]).includes(obj?.value))
            } else {
                role = [];
            }

            const modified: IAutor = {
                ...item,
                nationality: countryCode.filter((country: ILangCode) => item?.nationality?.includes(country.key)),
                role: role,
                dateOfBirth: item?.dateOfBirth ?
                    new Date(item?.dateOfBirth as string | number | Date) :
                    undefined,
                dateOfDeath: item?.dateOfDeath ?
                    new Date(item?.dateOfDeath as string | number | Date) :
                    undefined
            } as IAutor;

            return {
                ...emptyAutor,
                ...item,
                ...modified
            };
        });
    }

    const changeFormData = useCallback((input: any) => {
        setFormData((prevData: any) => handleInputChange(input, prevData));
    }, []);

    const getErrorMsg = (name: string): string => {
        return errors.find(err => err.target === name)?.label || "";
    }

    const isValidDate = (varToCheck: unknown) => {
        return varToCheck instanceof Date && !isNaN(varToCheck.valueOf());
    }

    return (
        <form>
            <div className="a-first-name">
                <InputField
                    placeholder='Krstné meno'
                    onChange={changeFormData}
                    {...getInputParams("firstName", formData, "Krstné meno")}
                />
            </div>

            <div className="a-last-name">
                <InputField
                    placeholder='*Priezvisko'
                    onChange={changeFormData}
                    customerror={getErrorMsg("lastName")}
                    {...getInputParams("lastName", formData, "*Priezvisko")}
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
                    placeholderText={getInputParams("dateOfBirth", formData, "Dátum narodenia").placeholder}
                    maxDate={new Date()}
                    autoComplete="off"
                />
                {isValidDate(formData && "dateOfBirth" in formData ? formData?.dateOfBirth : false) ?
                    <button className='clearInput' type="button" onClick={() => {
                        setFormData(formData.map((item: IAutor) => ({
                            ...item,
                            dateOfBirth: undefined
                        })))
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
                    placeholderText={getInputParams("dateOfDeath", formData, "Dátum smrti").placeholder}
                    maxDate={new Date()}
                    autoComplete="off"
                />
                {isValidDate(formData && "dateOfDeath" in formData ? formData?.dateOfDeath : false) ?
                    <button className='clearInput' type="button" onClick={() => {
                        setFormData(formData.map((item: IAutor) => ({
                            ...item,
                            dateOfDeath: undefined
                        })))
                    }}>&#10006;
                    </button> : <></>}
            </div>

            <div className="a-nationality">
                <LazyLoadMultiselect
                    selectionLimit={1}
                    options={countryCode}
                    displayValue="value"
                    placeholder="Národnosť"
                    onChange={changeFormData}
                    {...getInputParams("nationality", formData, "Národnosť")}
                />
            </div>

            <div className="a-role">
                <LazyLoadMultiselect
                    options={autorRoles}
                    displayValue="showValue"
                    placeholder="Role"
                    onChange={changeFormData}
                    {...getInputParams("role", formData, "Role")}
                />
            </div>

            <div className="a-note">
                <TextArea
                    id='note'
                    placeholder='Poznámka'
                    className="form-control"
                    autoComplete="off"
                    rows={1}
                    onChange={changeFormData}
                    {...getInputParams("note", formData, "Poznámka")}
                />
            </div>
        </form>
    )
}
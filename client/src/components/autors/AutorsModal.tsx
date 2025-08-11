import React, { useCallback, useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { countryCode, autorRoles } from "@utils";
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
    editedAutor?: IAutor;
}

interface ButtonsProps {
    saveAutor: () => void;
    cleanFields: () => void;
    error?: ValidationError[] | undefined;
    saveResultSuccess?: boolean;
}


export const AutorsModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const [formData, setFormData] = useState<IAutor[]>(
        Array.isArray(data) && data.length > 0 ? data : [{} as IAutor]
    );
    const [errors, setErrors] = useState<ValidationError[]>(
        [{ label: "Priezvisko autora musí obsahovať aspoň jeden znak!", target: "lastName" }]);
    const [reset, doReset] = useState<number>(0);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    // clear form btn
    useEffect(() => {
        if (!data) return;
        if (Array.isArray(data) && data.length === 1 && Object.keys(data[0]).length === 0 && data[0].constructor === Object) {
            setFormData(data);
            doReset(prev => prev + 1);
        }
    }, [data]);

    //edit autor
    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        const typedData = data[0] as IAutor;

        let role: any[] = [];
        if ("role" in typedData) {
            role = autorRoles.filter(obj => (typedData?.role as string[]).includes(obj?.value))
        } else {
            role = [];
        }

        const toBeModified: IAutor = {
            ...typedData,
            nationality: countryCode.filter((country: ILangCode) => typedData?.nationality?.includes(country.key)),
            role: role,
            dateOfBirth: typedData?.dateOfBirth ?
                new Date(typedData?.dateOfBirth as string | number | Date) :
                undefined,
            dateOfDeath: typedData?.dateOfDeath ?
                new Date(typedData?.dateOfDeath as string | number | Date) :
                undefined
        } as IAutor;

        setFormData([toBeModified]);
    }, []);


    // error handling
    useEffect(() => {
        if (!formData || !Array.isArray(formData) || formData.length === 0) return;
        const data = formData[0] as IAutor;

        let localErrors: ValidationError[] = [];

        //if length is over 0, its OK
        const autorLength = data.lastName?.trim().length > 0;
        if (!autorLength) {
            localErrors.push({ label: "Priezvisko autora musí obsahovať aspoň jeden znak!", target: "lastName" });
        } else {
            localErrors = localErrors?.filter((err: ValidationError) => err.target !== "lastName") ?? localErrors;
        }

        if (data.dateOfBirth && data.dateOfDeath) {
            //if dateOfBirth is sooner, its OK
            const dates = data.dateOfBirth! < data.dateOfDeath!;

            if (!dates) {
                localErrors.push({ label: "Dátum smrti nemôže byť skôr, než dátum narodenia!", target: "dateOfDeath" });
            } else {
                localErrors = localErrors?.filter((err: ValidationError) => err.target !== "dateOfDeath") ?? localErrors;
            }
        }

        setErrors(localErrors);
        error(localErrors);
    }, [formData]);


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
                    {...getInputParams("firstName", formData)}
                />
            </div>

            <div className="a-last-name">
                <InputField
                    placeholder='*Priezvisko'
                    onChange={changeFormData}
                    customerror={getErrorMsg("lastName")}
                    {...getInputParams("lastName", formData)}
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
                    placeholderText={"Dátum narodenia"}
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
                    placeholderText={"Dátum smrti"}
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
                    reset={Boolean(reset)}
                    {...getInputParams("nationality", formData)}
                />
            </div>

            <div className="a-role">
                <LazyLoadMultiselect
                    options={autorRoles}
                    displayValue="showValue"
                    placeholder="Role"
                    onChange={changeFormData}
                    reset={Boolean(reset)}
                    {...getInputParams("role", formData)}
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
                    {...getInputParams("note", formData)}
                />
            </div>
        </form>
    )
}
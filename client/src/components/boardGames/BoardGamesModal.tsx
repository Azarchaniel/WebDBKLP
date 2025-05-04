import React, {useCallback, useEffect, useState} from "react";
import {IBoardGame, ILangCode, ValidationError} from "../../type";
import {InputField, LazyLoadMultiselect} from "@components/inputs";
import {showError} from "../Modal";
import LoadingSpinner from "@components/LoadingSpinner";
import {countryCode, fetchAutors, fetchBoardGames} from "@utils";
import {createNewAutor, AutorRole} from "@utils/autor";
import FromToInput from "@components/inputs/FromToInput";
import TextArea from "@components/inputs/TextArea";

interface BodyProps {
    data: IBoardGame | object;
    onChange: (data: IBoardGame | object) => void;
    error: (err: ValidationError[] | undefined) => void;
}

interface ButtonsProps {
    saveBoardGame: () => void;
    cleanFields: () => void;
    error?: ValidationError[] | undefined;
    saveResultSuccess?: boolean;
}

export const BoardGamesModalBody: React.FC<BodyProps> = ({data, onChange, error}: BodyProps) => {
    const [formData, setFormData] = useState(data as any);
    const [errors, setErrors] = useState<ValidationError[]>([
        {label: "Názov musí obsahovať aspoň jeden znak!", target: "title"},
    ]);
    const [reset, doReset] = useState<number>(0);

    useEffect(() => {
        onChange(formData);
    }, [formData]);

    // clear form btn
    useEffect(() => {
        if (!data) return;
        if (Object.keys(data).length === 0 && data.constructor === Object) {
            setFormData(data);
            doReset(prev => prev + 1);
        }
    }, [data]);

    useEffect(() => {
        if (!data) return;

        const typedData = data as IBoardGame;
        const toBeModified: IBoardGame = {
            ...typedData,
            published: {
                ...typedData.published,
                country: countryCode.filter((country: ILangCode) =>
                    (typedData.published?.country as unknown as string[])?.includes(country.key))
            }
        }

        setFormData(toBeModified as any);
    }, []);

    useEffect(() => {
        const data = formData as IBoardGame;
        if (!data) return;

        let localErrors: ValidationError[] = [];

        if (!data.title?.trim()) {
            localErrors.push({label: "Názov musí obsahovať aspoň jeden znak!", target: "title"});
        } else {
            localErrors = localErrors.filter((err) => err.target !== "title");
        }

        setErrors(localErrors);
        error(localErrors);
    }, [formData]);

    const handleInputChange = useCallback((input: any) => {
        let name: string, value: string;

        if ("target" in input) { // if it is a regular event
            const {name: targetName, value: targetValue} = input.target;
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
            const updatedData = {...prevData}; // Clone previous data
            setNestedValue(updatedData, keys, value); // Set nested value

            return updatedData;
        });
    }, []);

    return (
        <form>
            <div className="bg-container">
                <div className="bg-title">
                    <InputField
                        value={formData?.title || ""}
                        placeholder="*Názov"
                        name="title"
                        onChange={handleInputChange}
                        customerror={errors.find((err) => err.target === "title")?.label || ""}
                    />
                </div>

                <div className="bg-autor">
                    <LazyLoadMultiselect
                        value={formData?.autor || []}
                        displayValue="fullName"
                        placeholder="Autor"
                        onChange={handleInputChange}
                        name="autor"
                        onSearch={fetchAutors}
                        onNew={(autorString) => createNewAutor(autorString, AutorRole.BOARDGAME_AUTOR, setFormData, "autor")}
                    />
                </div>

                <div className="bg-no-players">
                    <FromToInput
                        value={formData?.noPlayers}
                        placeholder="Počet hráčov"
                        name="noPlayers"
                        onChange={handleInputChange}
                    />
                </div>

                <div className="bg-play-time">
                    <FromToInput
                        value={formData?.playTime}
                        placeholder="Čas hrania (min)"
                        name="playTime"
                        onChange={handleInputChange}
                    />
                </div>

                <div className="bg-age-recommendation">
                    <FromToInput
                        value={formData?.ageRecommendation}
                        placeholder="Vekové rozmedzie"
                        name="ageRecommendation"
                        onChange={handleInputChange}
                    />
                </div>

                <div className="bg-publisher">
                    <InputField
                        value={formData?.published?.publisher || ""}
                        placeholder="Vydavateľ"
                        name="published.publisher"
                        onChange={handleInputChange}
                    />
                </div>

                <div className="bg-year-published">
                    <InputField
                        value={formData?.published?.year || ""}
                        placeholder="Rok vydania"
                        name="published.year"
                        type="number"
                        onChange={handleInputChange}
                    />
                </div>

                <div className="bg-country-published">
                    <LazyLoadMultiselect
                        selectionLimit={1}
                        value={formData?.published?.country}
                        options={countryCode}
                        displayValue="value"
                        placeholder="Krajina vydania"
                        onChange={handleInputChange}
                        name="published.country"
                        reset={Boolean(reset)}
                    />
                </div>

                <div className="bg-picture">
                    <InputField
                        value={formData?.picture || ""}
                        placeholder="Obrázok"
                        name="picture"
                        onChange={handleInputChange}
                    />
                </div>

                <div className="bg-url">
                    <InputField
                        value={formData?.url || ""}
                        placeholder="URL"
                        name="url"
                        onChange={handleInputChange}
                    />
                </div>

                <div className="bg-note">
                    <TextArea
                        placeholder="Poznámka"
                        name="note"
                        rows={1}
                        value={formData?.note || ""}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="bg-expansions">
                    <LazyLoadMultiselect
                        value={formData?.expansions || []}
                        displayValue="title"
                        placeholder="Rozšírenia"
                        onChange={handleInputChange}
                        name="expansions"
                        onSearch={fetchBoardGames}
                        reset={Boolean(reset)}
                    />
                </div>
            </div>
        </form>
    );
};

export const BoardGamesModalButtons: React.FC<ButtonsProps> = ({
                                                                   saveBoardGame,
                                                                   cleanFields,
                                                                   error,
                                                                   saveResultSuccess
                                                               }: ButtonsProps) => {
    const [loadingResult, setLoadingResult] = useState<boolean>(false);

    useEffect(() => {
        if (saveResultSuccess !== undefined && loadingResult) setLoadingResult(false);
    }, [saveResultSuccess]);

    const saveBoardGameHandler = useCallback(() => {
        setLoadingResult(true);
        saveBoardGame();
    }, [saveBoardGame]);

    return (
        <div className="column">
            <div>{showError(error)}</div>

            <div className="buttons">
                <button type="button" className="btn btn-secondary" onClick={cleanFields}>
                    Vymazať polia
                </button>
                <button
                    type="submit"
                    disabled={Boolean(error?.length) || loadingResult}
                    onClick={saveBoardGameHandler}
                    className="btn btn-success"
                >
                    {loadingResult ? <LoadingSpinner color="white" size={50} marginTop={1}/> : "Uložiť"}
                </button>
            </div>
        </div>
    );
};

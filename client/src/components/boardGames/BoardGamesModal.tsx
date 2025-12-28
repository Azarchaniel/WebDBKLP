import React, { useCallback, useEffect, useState } from "react";
import { IBoardGame, ILangCode, ValidationError } from "../../type";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import { countryCode, emptyBoardGame, fetchAutors, fetchBoardGames } from "@utils";
import { createNewAutor, AutorRole } from "@utils/autor";
import TextArea from "@components/inputs/TextArea";
import { ThreeStateToggleSwitch } from "@components/ToggleSwitch";
import { getInputParams, handleInputChange } from "@utils/form";

interface BodyProps {
    data: IBoardGame[];
    onChange: (data: IBoardGame[] | object) => void;
    error: (err: ValidationError[] | undefined) => void;
}

const getInitialExpansions = (data: IBoardGame | object): boolean | undefined => {
    if ((data as IBoardGame).children && (data as IBoardGame).children!.length > 0) {
        return true;
    }
    if ((data as IBoardGame).parent && (data as IBoardGame).parent!.length > 0) {
        return false;
    }
    return undefined;
};


export const BoardGamesModalBody: React.FC<BodyProps> = ({ data, onChange, error }: BodyProps) => {
    const [formData, setFormData] = useState(
        Array.isArray(data) && data.length > 0 ? data : [emptyBoardGame]
    );
    const [errors, setErrors] = useState<ValidationError[]>([
        { label: "Názov musí obsahovať aspoň jeden znak!", target: "title" }
    ]);
    const [expansions, setExpansions] = useState<boolean | undefined>(getInitialExpansions(formData));

    // Normalize board game data (like BookModal)
    const normalizeBGData = (boardGameArr: any[]): IBoardGame[] => {
        return (Array.isArray(boardGameArr) ? boardGameArr : [boardGameArr]).map((data: IBoardGame) => {
            if (!data) return emptyBoardGame;
            const modified: IBoardGame = {
                ...data,
                published: {
                    ...data.published,
                    country: countryCode.filter((country: ILangCode) =>
                        (data.published?.country as unknown as string[])?.includes(country.key))
                }
            };
            return {
                ...emptyBoardGame,
                ...data,
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
            setFormData(normalizeBGData(data));
        }
    }, [data]);

    // Error handling (like BookModal)
    useEffect(() => {
        if (!formData) return;
        let localErrors: ValidationError[] = [];
        const validateBG = (bg: IBoardGame) => {
            let errors: ValidationError[] = [];
            if (!bg.title?.trim()) {
                errors.push({ label: "Názov musí obsahovať aspoň jeden znak!", target: "title" });
            } else {
                errors = errors.filter((err) => err.target !== "title");
            }
            return errors;
        };
        if (Array.isArray(formData)) {
            const allErrors = (formData as IBoardGame[]).flatMap(validateBG);
            localErrors = allErrors;
        } else {
            localErrors = validateBG(formData as IBoardGame);
        }
        setErrors(localErrors);
        error(localErrors);
    }, [formData]);

    const getErrorMsg = (name: string): string => {
        return errors.find(err => err.target === name)?.label || "";
    };

    return (
        <form>
            <div className="bg-container">
                <div className="bg-title">
                    <InputField
                        placeholder="*Názov"
                        onChange={handleInputChange}
                        customerror={getErrorMsg("title")}
                        {...getInputParams("title", formData, "Názov")}
                    />
                </div>
                <div className="bg-autor">
                    <LazyLoadMultiselect
                        displayValue="fullName"
                        placeholder="Autor"
                        onChange={handleInputChange}
                        onSearch={fetchAutors}
                        onNew={async (autorString) => await createNewAutor(autorString, AutorRole.BOARDGAME_AUTOR, setFormData, "autor")}
                        {...getInputParams("autor", formData, "Autor")}
                    />
                </div>
                <div className="bg-publisher">
                    <InputField
                        placeholder="Vydavateľ"
                        onChange={handleInputChange}
                        {...getInputParams("published.publisher", formData, "Vydavateľ")}
                    />
                </div>
                <div className="bg-year-published">
                    <InputField
                        placeholder="Rok vydania"
                        type="number"
                        onChange={handleInputChange}
                        {...getInputParams("published.year", formData, "Rok vydania")}
                    />
                </div>
                <div className="bg-country-published">
                    <LazyLoadMultiselect
                        selectionLimit={1}
                        options={countryCode}
                        displayValue="value"
                        placeholder="Krajina vydania"
                        onChange={handleInputChange}
                        {...getInputParams("published.country", formData, "Krajina vydania")}
                    />
                </div>
                <div className="bg-no-players">
                    <InputField
                        placeholder="Počet hráčov od"
                        onChange={handleInputChange}
                        {...getInputParams("noPlayers.from", formData, "Počet hráčov od")}
                    />
                    <InputField
                        placeholder="Počet hráčov do"
                        onChange={handleInputChange}
                        {...getInputParams("noPlayers.to", formData, "Počet hráčov do")}
                    />
                </div>
                <div className="bg-play-time">
                    <InputField
                        placeholder="Čas hrania od"
                        onChange={handleInputChange}
                        {...getInputParams("playTime.from", formData, "Čas hrania od")}
                    />
                    <InputField
                        placeholder="Čas hrania do"
                        onChange={handleInputChange}
                        {...getInputParams("playTime.to", formData, "Čas hrania do")}
                    />
                </div>
                <div className="bg-age-recommendation">
                    <InputField
                        placeholder="Veková kategória od"
                        onChange={handleInputChange}
                        {...getInputParams("ageRecommendation.from", formData, "Veková kategória od")}
                    />
                    <InputField
                        placeholder="Veková kategória do"
                        onChange={handleInputChange}
                        {...getInputParams("ageRecommendation.to", formData, "Veková kategória do")}
                    />
                </div>
                <div className="bg-picture">
                    <InputField
                        placeholder="Obrázok"
                        onChange={handleInputChange}
                        {...getInputParams("picture", formData, "Obrázok")}
                    />
                </div>
                <div className="bg-url">
                    <InputField
                        placeholder="URL"
                        onChange={handleInputChange}
                        {...getInputParams("url", formData, "URL")}
                    />
                </div>
                <div className="bg-note">
                    <TextArea
                        placeholder="Poznámka"
                        rows={1}
                        onChange={handleInputChange}
                        {...getInputParams("note", formData, "Poznámka")}
                    />
                </div>
                <div className="bg-expansions row">
                    <div className="col">
                        <ThreeStateToggleSwitch
                            id="expansions"
                            name="expansions"
                            state={expansions}
                            onChange={(state: boolean | undefined) => setExpansions(state)}
                            optionLabels={["Má rozšírenia (deti)", "Žiadne rozšírenia", "Patrí k hre (rodičovi)"]}
                            {...getInputParams("expansions", formData, "Rozšírenia")}
                        />
                    </div>
                    <div className="col">
                        {expansions ?
                            <LazyLoadMultiselect
                                disabled={expansions === undefined}
                                displayValue="title"
                                placeholder="Má rozšírenia (deti)"
                                onChange={handleInputChange}
                                onSearch={fetchBoardGames}
                                {...getInputParams("children", formData, "Má rozšírenia (deti)")}
                            /> :
                            <LazyLoadMultiselect
                                disabled={expansions === undefined}
                                selectionLimit={1}
                                displayValue="title"
                                placeholder="Patrí k hre (rodičovi)"
                                onChange={handleInputChange}
                                onSearch={fetchBoardGames}
                                {...getInputParams("parent", formData, "Patrí k hre (rodičovi)")}
                            />}
                    </div>
                </div>
            </div>
        </form>
    );
};

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
        Array.isArray(data) && data.length > 0
            ? data
            : [emptyBoardGame]
    );
    const [errors, setErrors] = useState<ValidationError[]>([
        { label: "Názov musí obsahovať aspoň jeden znak!", target: "title" },
    ]);
    const [expansions, setExpansions] = useState<boolean | undefined>(getInitialExpansions(formData));

    // send form data to parent
    useEffect(() => {
        onChange(formData);
    }, [formData]);

    // clear form btn
    useEffect(() => {
        if (formData && JSON.stringify(data) !== JSON.stringify(formData)) {
            setFormData(normalizeBGData(data));
        }
    }, [data]);

    // edit bg
    useEffect(() => {
        if (!data || !Array.isArray(data) || data.length === 0) return;

        const modifiedBG = normalizeBGData(data);
        setFormData(modifiedBG);
    }, []);

    useEffect(() => {
        if (!formData || !Array.isArray(formData) || formData.length === 0) return;
        const data = formData[0] as IBoardGame;

        let localErrors: ValidationError[] = [];

        if (!data.title?.trim()) {
            localErrors.push({ label: "Názov musí obsahovať aspoň jeden znak!", target: "title" });
        } else {
            localErrors = localErrors.filter((err) => err.target !== "title");
        }

        setErrors(localErrors);
        error(localErrors);
    }, [formData]);

    const normalizeBGData = (boardGame: any[]): IBoardGame[] => {
        return (Array.isArray(boardGame) ? boardGame : [boardGame]).map((data: IBoardGame) => {
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
            }
        });
    };

    const changeFormData = useCallback((input: any) => {
        setFormData((prevData: any) => handleInputChange(input, prevData));
    }, []);

    return (
        <form>
            <div className="bg-container">
                <div className="bg-title">
                    <InputField
                        placeholder="*Názov"
                        onChange={changeFormData}
                        customerror={errors.find((err) => err.target === "title")?.label || ""}
                        {...getInputParams("title", formData, "Názov")}
                    />
                </div>

                <div className="bg-autor">
                    <LazyLoadMultiselect
                        displayValue="fullName"
                        placeholder="Autor"
                        onChange={changeFormData}
                        onSearch={fetchAutors}
                        onNew={(autorString) => createNewAutor(autorString, AutorRole.BOARDGAME_AUTOR, setFormData, "autor")}
                        {...getInputParams("autor", formData, "Autor")}
                    />
                </div>

                <div className="bg-publisher">
                    <InputField
                        placeholder="Vydavateľ"
                        onChange={changeFormData}
                        {...getInputParams("published.publisher", formData, "Vydavateľ")}
                    />
                </div>

                <div className="bg-year-published">
                    <InputField
                        placeholder="Rok vydania"
                        type="number"
                        onChange={changeFormData}
                        {...getInputParams("published.year", formData, "Rok vydania")}
                    />
                </div>

                <div className="bg-country-published">
                    <LazyLoadMultiselect
                        selectionLimit={1}
                        options={countryCode}
                        displayValue="value"
                        placeholder="Krajina vydania"
                        onChange={changeFormData}
                        {...getInputParams("published.country", formData, "Krajina vydania")}
                    />
                </div>

                <div className="bg-no-players">
                    <InputField
                        placeholder="Počet hráčov od"
                        onChange={changeFormData}
                        {...getInputParams("noPlayers.from", formData, "Počet hráčov od")}
                    />
                    <InputField
                        placeholder="Počet hráčov do"
                        onChange={changeFormData}
                        {...getInputParams("noPlayers.to", formData, "Počet hráčov do")}
                    />
                </div>

                <div className="bg-play-time">
                    <InputField
                        placeholder="Čas hrania od"
                        onChange={changeFormData}
                        {...getInputParams("playTime.from", formData, "Čas hrania od")}
                    />
                    <InputField
                        placeholder="Čas hrania do"
                        onChange={changeFormData}
                        {...getInputParams("playTime.to", formData, "Čas hrania do")}
                    />
                </div>

                <div className="bg-age-recommendation">
                    <InputField
                        placeholder="Veková kategória od"
                        onChange={changeFormData}
                        {...getInputParams("ageRecommendation.from", formData, "Veková kategória od")}
                    />
                    <InputField
                        placeholder="Veková kategória do"
                        onChange={changeFormData}
                        {...getInputParams("ageRecommendation.to", formData, "Veková kategória do")}
                    />
                </div>

                <div className="bg-picture">
                    <InputField
                        placeholder="Obrázok"
                        onChange={changeFormData}
                        {...getInputParams("picture", formData, "Obrázok")}
                    />
                </div>

                <div className="bg-url">
                    <InputField
                        placeholder="URL"
                        onChange={changeFormData}
                        {...getInputParams("url", formData, "URL")}
                    />
                </div>

                <div className="bg-note">
                    <TextArea
                        placeholder="Poznámka"
                        rows={1}
                        onChange={changeFormData}
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
                                onChange={changeFormData}
                                onSearch={fetchBoardGames}
                                {...getInputParams("children", formData, "Má rozšírenia (deti)")}
                            /> :
                            <LazyLoadMultiselect
                                disabled={expansions === undefined}
                                selectionLimit={1}
                                displayValue="title"
                                placeholder="Patrí k hre (rodičovi)"
                                onChange={changeFormData}
                                onSearch={fetchBoardGames}
                                {...getInputParams("parent", formData, "Patrí k hre (rodičovi)")}
                            />}
                    </div>
                </div>
            </div>
        </form>
    );
};

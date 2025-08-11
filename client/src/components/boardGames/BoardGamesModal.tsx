import React, { useCallback, useEffect, useState } from "react";
import { IBoardGame, ILangCode, ValidationError } from "../../type";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import { countryCode, fetchAutors, fetchBoardGames } from "@utils";
import { createNewAutor, AutorRole } from "@utils/autor";
import TextArea from "@components/inputs/TextArea";
import { ThreeStateToggleSwitch } from "@components/ToggleSwitch";
import { handleInputChange } from "@utils/form";

interface BodyProps {
    data: IBoardGame | object;
    onChange: (data: IBoardGame | object) => void;
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
    const [formData, setFormData] = useState(data as any);
    const [errors, setErrors] = useState<ValidationError[]>([
        { label: "Názov musí obsahovať aspoň jeden znak!", target: "title" },
    ]);
    const [reset, doReset] = useState<number>(0);
    const [expansions, setExpansions] = useState<boolean | undefined>(getInitialExpansions(data));

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

    const changeFormData = useCallback((input: any) => {
        setFormData((prevData: any) => handleInputChange(input, prevData));
    }, []);

    return (
        <form>
            <div className="bg-container">
                <div className="bg-title">
                    <InputField
                        value={formData?.title || ""}
                        placeholder="*Názov"
                        name="title"
                        onChange={changeFormData}
                        customerror={errors.find((err) => err.target === "title")?.label || ""}
                    />
                </div>

                <div className="bg-autor">
                    <LazyLoadMultiselect
                        value={formData?.autor || []}
                        displayValue="fullName"
                        placeholder="Autor"
                        onChange={changeFormData}
                        name="autor"
                        onSearch={fetchAutors}
                        onNew={(autorString) => createNewAutor(autorString, AutorRole.BOARDGAME_AUTOR, setFormData, "autor")}
                    />
                </div>

                <div className="bg-publisher">
                    <InputField
                        value={formData?.published?.publisher || ""}
                        placeholder="Vydavateľ"
                        name="published.publisher"
                        onChange={changeFormData}
                    />
                </div>

                <div className="bg-year-published">
                    <InputField
                        value={formData?.published?.year || ""}
                        placeholder="Rok vydania"
                        name="published.year"
                        type="number"
                        onChange={changeFormData}
                    />
                </div>

                <div className="bg-country-published">
                    <LazyLoadMultiselect
                        selectionLimit={1}
                        value={formData?.published?.country}
                        options={countryCode}
                        displayValue="value"
                        placeholder="Krajina vydania"
                        onChange={changeFormData}
                        name="published.country"
                        reset={Boolean(reset)}
                    />
                </div>

                <div className="bg-no-players">
                    <InputField
                        value={formData?.noPlayers?.from}
                        placeholder="Počet hráčov od"
                        name="published.publisher"
                        onChange={changeFormData}
                    />
                    <InputField
                        value={formData?.noPlayers?.to}
                        placeholder="Počet hráčov do"
                        name="published.publisher"
                        onChange={changeFormData}
                    />
                </div>

                <div className="bg-play-time">
                    <InputField
                        value={formData?.playTime?.from}
                        placeholder="Čas hrania od"
                        name="published.publisher"
                        onChange={changeFormData}
                    />
                    <InputField
                        value={formData?.playTime?.to}
                        placeholder="Čas hrania do"
                        name="published.publisher"
                        onChange={changeFormData}
                    />
                </div>

                <div className="bg-age-recommendation">
                    <InputField
                        value={formData?.ageRecommendation?.from}
                        placeholder="Veková kategória od"
                        name="published.publisher"
                        onChange={changeFormData}
                    />
                    <InputField
                        value={formData?.ageRecommendation?.to}
                        placeholder="Veková kategória do"
                        name="published.publisher"
                        onChange={changeFormData}
                    />
                </div>

                <div className="bg-picture">
                    <InputField
                        value={formData?.picture || ""}
                        placeholder="Obrázok"
                        name="picture"
                        onChange={changeFormData}
                    />
                </div>

                <div className="bg-url">
                    <InputField
                        value={formData?.url || ""}
                        placeholder="URL"
                        name="url"
                        onChange={changeFormData}
                    />
                </div>

                <div className="bg-note">
                    <TextArea
                        placeholder="Poznámka"
                        name="note"
                        rows={1}
                        value={formData?.note || ""}
                        onChange={changeFormData}
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
                        />
                    </div>
                    <div className="col">
                        {expansions ?
                            <LazyLoadMultiselect
                                disabled={expansions === undefined}
                                value={formData?.children || []}
                                displayValue="title"
                                placeholder="Má rozšírenia (deti)"
                                onChange={changeFormData}
                                name="children"
                                onSearch={fetchBoardGames}
                                reset={Boolean(reset)}
                            /> :
                            <LazyLoadMultiselect
                                disabled={expansions === undefined}
                                selectionLimit={1}
                                value={formData?.parent || []}
                                displayValue="title"
                                placeholder="Patrí k hre (rodičovi)"
                                onChange={changeFormData}
                                name="parent"
                                onSearch={fetchBoardGames}
                                reset={Boolean(reset)}
                            />}
                    </div>
                </div>
            </div>
        </form>
    );
};

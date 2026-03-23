import React, { useCallback, useEffect, useState } from "react";
import { IBoardGame, ILangCode, ValidationError } from "../../type";
import { InputField, LazyLoadMultiselect } from "@components/inputs";
import { countryCode, EMPTY_BOARD_GAME, fetchAutors, fetchBoardGames } from "@utils";
import { createNewAutor, AutorRole } from "@utils/autor";
import TextArea from "@components/inputs/TextArea";
import { ThreeStateToggleSwitch } from "@components/ToggleSwitch";
import { getInputParams, handleInputChange } from "@utils/form";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
    const [formData, setFormData] = useState(
        Array.isArray(data) && data.length > 0 ? data : [EMPTY_BOARD_GAME]
    );
    const [errors, setErrors] = useState<ValidationError[]>([
        { label: t("validation.boardGameTitleRequired"), target: "title" }
    ]);
    const [expansions, setExpansions] = useState<boolean | undefined>(getInitialExpansions(formData));

    // Normalize board game data (like BookModal)
    const normalizeBGData = (boardGameArr: any[]): IBoardGame[] => {
        return (Array.isArray(boardGameArr) ? boardGameArr : [boardGameArr]).map((data: IBoardGame) => {
            if (!data) return EMPTY_BOARD_GAME;
            const modified: IBoardGame = {
                ...data,
                published: {
                    ...data.published,
                    country: countryCode.filter((country: ILangCode) =>
                        (data.published?.country as unknown as string[])?.includes(country.key))
                }
            };
            return {
                ...EMPTY_BOARD_GAME,
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
                errors.push({ label: t("validation.boardGameTitleRequired"), target: "title" });
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
                        placeholder={t("fields.titleRequired")}
                        onChange={handleInputChange}
                        customerror={getErrorMsg("title")}
                        {...getInputParams("title", formData, t("common.title"))}
                    />
                </div>
                <div className="bg-autor">
                    <LazyLoadMultiselect
                        displayValue="fullName"
                        placeholder={t("common.author")}
                        onChange={handleInputChange}
                        onSearch={fetchAutors}
                        onNew={async (autorString) => await createNewAutor(autorString, AutorRole.BOARDGAME_AUTOR, setFormData, "autor")}
                        {...getInputParams("autor", formData, t("common.author"))}
                    />
                </div>
                <div className="bg-publisher">
                    <InputField
                        placeholder={t("common.publisher")}
                        onChange={handleInputChange}
                        {...getInputParams("published.publisher", formData, t("common.publisher"))}
                    />
                </div>
                <div className="bg-year-published">
                    <InputField
                        placeholder={t("fields.yearPublished")}
                        type="number"
                        onChange={handleInputChange}
                        {...getInputParams("published.year", formData, t("fields.yearPublished"))}
                    />
                </div>
                <div className="bg-country-published">
                    <LazyLoadMultiselect
                        selectionLimit={1}
                        options={countryCode}
                        displayValue="value"
                        placeholder={t("fields.countryPublished")}
                        onChange={handleInputChange}
                        {...getInputParams("published.country", formData, t("fields.countryPublished"))}
                    />
                </div>
                <div className="bg-no-players">
                    <InputField
                        placeholder={t("fields.numberPlayersFrom")}
                        onChange={handleInputChange}
                        {...getInputParams("noPlayers.from", formData, t("fields.numberPlayersFrom"))}
                    />
                    <InputField
                        placeholder={t("fields.numberPlayersTo")}
                        onChange={handleInputChange}
                        {...getInputParams("noPlayers.to", formData, t("fields.numberPlayersTo"))}
                    />
                </div>
                <div className="bg-play-time">
                    <InputField
                        placeholder={t("fields.playTimeFrom")}
                        onChange={handleInputChange}
                        {...getInputParams("playTime.from", formData, t("fields.playTimeFrom"))}
                    />
                    <InputField
                        placeholder={t("fields.playTimeTo")}
                        onChange={handleInputChange}
                        {...getInputParams("playTime.to", formData, t("fields.playTimeTo"))}
                    />
                </div>
                <div className="bg-age-recommendation">
                    <InputField
                        placeholder={t("fields.ageFrom")}
                        onChange={handleInputChange}
                        {...getInputParams("ageRecommendation.from", formData, t("fields.ageFrom"))}
                    />
                    <InputField
                        placeholder={t("fields.ageTo")}
                        onChange={handleInputChange}
                        {...getInputParams("ageRecommendation.to", formData, t("fields.ageTo"))}
                    />
                </div>
                <div className="bg-picture">
                    <InputField
                        placeholder={t("fields.image")}
                        onChange={handleInputChange}
                        {...getInputParams("picture", formData, t("fields.image"))}
                    />
                </div>
                <div className="bg-url">
                    <InputField
                        placeholder={t("common.url")}
                        onChange={handleInputChange}
                        {...getInputParams("url", formData, t("common.url"))}
                    />
                </div>
                <div className="bg-note">
                    <TextArea
                        placeholder={t("common.note")}
                        rows={1}
                        onChange={handleInputChange}
                        {...getInputParams("note", formData, t("common.note"))}
                    />
                </div>
                <div className="bg-expansions">
                    <div className="bg-expansions-toggle">
                        <ThreeStateToggleSwitch
                            id="expansions"
                            name="expansions"
                            state={expansions}
                            onChange={(state: boolean | undefined) => setExpansions(state)}
                            optionLabels={[t("fields.expansionsChildren"), t("fields.expansionsNone"), t("fields.expansionsParent")]}
                            {...getInputParams("expansions", formData, t("fields.expansions"))}
                        />
                    </div>
                    <div className="bg-expansions-select">
                        {expansions ?
                            <LazyLoadMultiselect
                                disabled={expansions === undefined}
                                displayValue="title"
                                placeholder={t("fields.expansionsChildren")}
                                onChange={handleInputChange}
                                onSearch={fetchBoardGames}
                                {...getInputParams("children", formData, t("fields.expansionsChildren"))}
                            /> :
                            <LazyLoadMultiselect
                                disabled={expansions === undefined}
                                selectionLimit={1}
                                displayValue="title"
                                placeholder={t("fields.expansionsParent")}
                                onChange={handleInputChange}
                                onSearch={fetchBoardGames}
                                {...getInputParams("parent", formData, t("fields.expansionsParent"))}
                            />}
                    </div>
                </div>
            </div>
        </form>
    );
};

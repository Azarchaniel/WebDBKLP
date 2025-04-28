import {getUniqueFieldValues} from "../API";
import React, {useEffect, useState} from "react";
import {InputField, LazyLoadMultiselect} from "@components/inputs";
import { IUniqueFilterValues } from "type";
import { mapColumnVisibilityToFilterValues } from "@utils";
import {getBookTableColumns} from "../utils/tableColumns"; // Import column definitions

interface FilterProps {
    show: boolean;
    selectedFilters: (val: any) => void;
    columnVisibility: Record<string, boolean>;
}

const FilterRow = ({show, selectedFilters, columnVisibility}: FilterProps) => {
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [uniqueFilterValues, setUniqueFilterValues] = useState<IUniqueFilterValues>({});
    const [selected, setSelected] = useState<IUniqueFilterValues>({});

    useEffect(() => {
        setSelected({});
        setLoadingFilters(true);
        getUniqueFieldValues()
            .then(({data}) => {
                console.log(Object.keys(data));
                setUniqueFilterValues(data);
            })
            .catch((err) => console.trace(err))
            .finally(() => setLoadingFilters(false));
    }, []);

    const selectFields = ['autor', 'editor', 'translator', 'ilustrator', 'owner', 'readBy', "language"];
    const inputFields = ["title", "subtitle", "content", "edition.no", "edition.title", "serie.no", "serie.title", "ISBN", "note", "published.publisher", "published.country", "location.city", "location.shelf"];
    const numberFields = ["dimensions.height", "dimensions.width", "dimensions.depth", "dimensions.weight", "numberOfPages", "published.year"];
    const checkboxFields = ["exLibris"];

    const visibleFilters = mapColumnVisibilityToFilterValues(columnVisibility); // Map visible columns to filters
    const columnOrder = getBookTableColumns().map((column: any) => column.accessorKey); // Extract column order

    const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | {
        name: string,
        value: any
    }) => {
        const nameSelected = "target" in event ? event.target.name : event.name;
        const valueSelected = "target" in event ? event.target.value : event.value;

        setSelected(prevSelected => {
            const updatedSelected = {
                ...prevSelected,
                [nameSelected]: valueSelected === '' ? undefined : valueSelected
            };

            selectedFilters(updatedSelected);
            return updatedSelected;
        });
    };

    const onOperatorChange = (key: string, operator: string) => {
        setSelected(prevSelected => {
            const currentValue = getValue(key)?.slice(1) || ''; // Extract the number part
            const updatedSelected = {
                ...prevSelected,
                [key]: `${operator}${currentValue}` // Combine operator and value
            };

            selectedFilters(updatedSelected);
            return updatedSelected;
        });
    };

    const getValue = (key: string): any => {
        return selected[key as keyof IUniqueFilterValues];
    };

    const renderInputs = () => {
        return (
            <>
                {Object.keys(uniqueFilterValues)
                    .filter((key) => key in visibleFilters) // Filter inputs based on visible columns
                    .sort((a, b) => columnOrder.indexOf(a) - columnOrder.indexOf(b)) // Sort inputs by column order
                    .map((key: string) => {
                    if (selectFields.includes(key)) {
                        return (
                            <td key={key}>
                                <LazyLoadMultiselect
                                    value={getValue(key) || []}
                                    displayValue="name"
                                    placeholder={`${key}`}
                                    onChange={onChange}
                                    name={key}
                                    options={uniqueFilterValues[key as keyof IUniqueFilterValues]}
                                />
                            </td>
                        );
                    } else if (inputFields.includes(key)) {
                        const currentValue = getValue(key) ?? '';

                        return (
                            <td key={key}>
                                <InputField
                                    name={key}
                                    placeholder={`${key}`}
                                    className="form-control searchBookInput"
                                    value={currentValue}
                                    onChange={(e) => onChange({name: key, value: e.target.value})}
                                />
                            </td>
                        );
                    } else if (numberFields.includes(key)) {
                        const currentValue = getValue(key)?.slice(1) || ''; // Extract the number part
                        const currentOperator = getValue(key)?.[0] || '='; // Extract the operator

                        return (
                            <td key={key}>
                                <div className="number-field-container">
                                    <select
                                        id="operator-select"
                                        value={currentOperator}
                                        onChange={(e) => onOperatorChange(key, e.target.value)}
                                    >
                                        {["=", ">", "<", "≠"].map((operator) => (
                                            <option key={operator} value={operator}>
                                                {operator}
                                            </option>
                                        ))}
                                    </select>

                                    <InputField
                                        name={key}
                                        type="number"
                                        placeholder={`${key}`}
                                        className="form-control searchBookInput"
                                        value={currentValue}
                                        onChange={(e) => onChange({
                                            name: key,
                                            value: `${currentOperator}${e.target.value}`
                                        })}
                                    />
                                </div>
                            </td>
                        );
                    } else if (checkboxFields.includes(key)) {
                        const currentValue = getValue(key) ?? '';

                        return (
                            <td key={key}>
                                <select
                                    id="exLibris"
                                    title="Ex Libris"
                                    value={currentValue}
                                    onChange={(e) => onChange({name: key, value: e.target.value})}
                                >
                                    {["", "Áno", "Nie"].map((operator) => (
                                        <option key={operator} value={operator}>
                                            {operator}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        );
                    } else {
                        console.error("Unknown key in uniqueFilterValues: ", key);
                    }
                })}
            </>
        );
    };

    return (
        <>
            {show && loadingFilters && <tr><td colSpan={Object.keys(uniqueFilterValues).length}>Načítavam...</td></tr>}
            {show && !loadingFilters && (
                <tr className="filter-row-wrapper">
                    {renderInputs()}
                </tr>
            )}
        </>
    );
}

export default FilterRow;


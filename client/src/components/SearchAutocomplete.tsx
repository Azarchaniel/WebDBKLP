import React, {useEffect} from "react";

//https://docs.google.com/document/d/1Ph1gOGJcnxaUU1ec8433nXLbxSRwlZlBsjUMboMWHPA/edit

//TODO: FINISH
const SearchAutocomplete = (
    data: [],
    multiple: Boolean = false,
    placeholder: string,
    searchInAttr: string,
    showTable: Boolean,
    showAttrInDropdown?: string,
    showAttrInTableOrResult?: string
    ) => {
    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
    }, []);

    let isOpen: boolean = false;
    let searchTerm: string = '';
    let results: any[] = [];
    let selected: any[] = [];
    let search: any = '';
    let isLoading: boolean = false;

    const filterResults = () => {
        const arrOfSearch = searchTerm.split(/[\s,]+/);
        let result: any[] = [];

        for (let search of arrOfSearch) {
            result = data.filter((item: any) => {
                if (typeof item === 'string') {
                    if (item.toLowerCase().indexOf(search.toLowerCase()) > -1) {
                        results.push(item);
                    };
                } else {
                    if (searchInAttr) {
                        //if there are specified attributes to search in, split to array and iterate over them
                        const arrayOfAtrs = searchInAttr.split(',');
                        for (let attr of arrayOfAtrs) {
                            if (!(attr in item)) throw Error("Unknown attribute, can't search by it!");
                            if (item[attr].toLowerCase().indexOf(search.toLowerCase()) > -1) {
                                results.push(item);
                            }
                        }
                    } else {
                        //otherwise, iterate over every attribute, where value is not Object (could be problem with encapsulation)
                        // .toString, because we might want to search numbers
                        Object.keys(item).map(attr => {
                            if (typeof item[attr] !== 'object') {
                                if (
                                    item[attr]
                                        .toString()
                                        .toLowerCase()
                                        .indexOf(search.toString().toLowerCase()) > -1
                                ) {
                                    results.push(item);
                                }
                            }
                        });
                    }
                }
            });

            //remove duplicates and then remove from results, if item is selected
            results = Array.from(new Set(results)).filter((fil: any) => {
                if (typeof fil === 'string') {
                    return selected.every((sel: any) => fil !== sel);
                } else {
                    return selected.every((sel: any) => {
                        return fil.id !== sel.id;
                    });
                }
            });
            return result;

    }

    }

    const onChange = () => {
        filterResults();
        isOpen = true;
    }

    const setSearch = (result: string) => {
        if (!multiple) {
            if (showAttrInTableOrResult) {
                search = showValue([result], showAttrInTableOrResult);
                isOpen = false;
            }
        }
    }

    const addItem = (item: any) => {
        selected.push(item);
        if (!multiple) {
            search = '';
            isOpen = false;
        }
        filterResults();
    }

    const removeItem = (item: any) => {
        selected = selected.filter((r: any) => item !== r);
    }

    const updateItems = (v: any[]) => {
        selected = v;
    }

    const showAll = () => {
        filterResults();
        isOpen = true;
    }

    const showValue = (array: any[], criteria: string | undefined) => {
        /**
         * Divide showAtrInDropdown into chunks (words, spaces, characters...)
         * Iterate over every item in result
         * take every chunk of showAtrInDropdown and test, if it is key in item of result
         * if it is key, take its value
         * else just take that chunk and put it to result string
         *
         * Example
         * array = [{ id: 0, first_name: 'John', last_name: 'Smith'}];
         * showAtrInDropdown = 'first_name / last_name';
         * RESULT => 'John / Smith'
         */

        let arrOfAttrs = criteria!.match(/\w+|\s+|[^\s\w]+/g);
        return array.map((res: any) => {
            let strOfKeys: string = '';
            if (!arrOfAttrs) return;
            for (let element of arrOfAttrs) {
                if (typeof res === 'string') return;
                if (element in res) {
                    strOfKeys += res[element];
                } else {
                    strOfKeys += element;
                }
            }

            return strOfKeys;

        });
    };

    const handleClickOutside = (event: any) => {
        console.trace(event);
    }

    const resultsTable = () => {
        let loadingElement: JSX.Element = <></>;
        let noDataElement: JSX.Element = <></>;
        let results: JSX.Element[] = [];
        if (!isOpen) return <></>;
        if (isLoading) loadingElement = <li className="loading">Načítam dáta</li>;
        if (!isLoading && !results.length) noDataElement = <li className="loading">Žiadne výsledky</li>;
        if (!isLoading && results.length) {
            results.forEach((element: any) => {
                results.push(
                    <div className="row">
                        <li className="autocomplete-result"
                        onClick={() => setSearch(element)}
                        >
                            {showValue([element], showAttrInDropdown)[0]}
                            <i className="fas fa-plus plusSign" onClick={() => addItem(element)}/>
                        </li>
                    </div>);
            })
        }

        //  what to do with results? FUCK REACT
        if (showTable && selected.length) {
            return (<div className="selected">

            </div>)
        }

        return (
            <ul className="autocomplete-results">
                {loadingElement}
                {noDataElement}
                {results}
            </ul>
        )
    }

    return (
        <div className="auutocomplete">
            <input
                type="text"
                onChange={onChange}
                value={search}
                className="autocomplete-input"
                onDoubleClick={showAll}
                placeholder={placeholder}
            />
            {resultsTable()}
        </div>
    );
}
export default SearchAutocomplete;

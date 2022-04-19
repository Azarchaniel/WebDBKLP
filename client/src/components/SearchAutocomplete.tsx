// @ts-nocheck
import React, {useEffect, useState} from "react";
import {IBook} from "../type";

//https://docs.google.com/document/d/1Ph1gOGJcnxaUU1ec8433nXLbxSRwlZlBsjUMboMWHPA/edit

type SAstyle = {
    input?: {}
};

interface SAprops {
    data: any;
    multiple: Boolean;
    placeholder: string;
    searchInAttr: string;
    showTable: Boolean;
    async?: Boolean;
    showAttrInDropdown?: string;
    showAttrInTableOrResult?: string;
    style?: SAstyle;
}

//TODO: FINISH
const SearchAutocomplete: (props: SAprops) => JSX.Element = (props) => {
    const {data, multiple, placeholder, searchInAttr, showTable, showAttrInDropdown, showAttrInTableOrResult, async, style } = props;
    const [dataLocal, setDataLocal] = useState<any[]>();
    const [found, setFound] = useState<any[]>();
    const [isOpen, setIsOpen] = useState<boolean>(false);

    useEffect(async () => {
        if (async) {
            let neco = await data;
            setDataLocal(neco.data.books.filter((book: IBook) => !book.deletedAt));
        }
        //document.addEventListener('click', handleClickOutside);
    }, []);

    let selected: any[] = [];
    let isLoading: boolean = false;

    const filterResults = (input: string) => {
        const arrOfSearch = input?.split(/[\s,]+/);
        if (!dataLocal || !arrOfSearch) return;
        let results: any[] = [];

        for (let search of arrOfSearch) {
            dataLocal?.forEach(item => {

                //if in data, there are not {} but ""
                if (typeof item === 'string') {
                    if (item.toLowerCase().indexOf(search.toLowerCase()) > -1) {
                        results.push(item);
                    }
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
            /*results = Array.from(new Set(results)).filter((fil: any) => {
                if (typeof fil === 'string') {
                    return selected.every((sel: any) => fil !== sel);
                } else {
                    return selected.every((sel: any) => {
                        return fil._id !== sel._id;
                    });
                }
            });*/
            console.log(results);
            return results;
        }
    }

    const onChange = (e: any) => {
        setIsOpen(true);
        setFound(filterResults(e.target?.value ?? ''))
    }

    /*const setSearch = (result: string) => {
        if (!multiple) {
            if (showAttrInTableOrResult) {
                setInput(showValue([result], showAttrInTableOrResult));
                isOpen = false;
            }
        }
    }*/

    const addItem = (item: any) => {
        selected.push(item);
        if (!multiple) {
            //setInput('');
            setIsOpen(true);
        }
        //filterResults();
    }

    const removeItem = (item: any) => {
        selected = selected.filter((r: any) => item !== r);
    }

    const updateItems = (v: any[]) => {
        selected = v;
    }

    const showAll = () => {
        setFound(filterResults(''));
        setIsOpen(true);
    }

    const showValue = (array: any[], criteria: string | undefined) => {
        //todo: support nested objects like - book.autor.first_name

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

            //todo: here should be recursive function, if I put 'auutor.firstName'

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

    /*const handleClickOutside = (event: any) => {
        console.trace(event);
    }*/

    const resultsTable = () => {
        console.log(isOpen);
        let loadingElement: JSX.Element = <></>;
        let noDataElement: JSX.Element = <></>;
        let results: any[] = [];
        if (!isOpen) return <></>;
        if (isLoading) loadingElement = <li className="loading">Načítam dáta</li>;
        if (!isLoading && !found?.length) noDataElement = <li className="loading">Žiadne výsledky</li>;
        if (!isLoading && found?.length) {
            found.forEach((element: any) => {
                results.push(
                    <div className="row">
                        <li className="autocomplete-result"
                            onClick={() => /*setInput(element)*/console.log()}
                        >
                            <span>{showValue([element], showAttrInDropdown)[0]}</span>
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
                className="autocomplete-input"
                onDoubleClick={showAll}
                placeholder={placeholder}
                style={style.input}
            />
            {resultsTable()}
        </div>
    );
}
export default SearchAutocomplete;

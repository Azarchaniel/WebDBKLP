import Autor from "../src/models/autor";
import mongoose from "mongoose";
import express, {Express} from "express";
import Book from "../src/models/book";
import LP from "../src/models/lp";
import Quote from "../src/models/quote";
import {IBook} from "../src/types";
import {AutorRole} from "../src/utils/constants";

/**
 * Save as: Text oddeleny tabulatormi; change postfix to csv
 * HOW TO RUN:
 * npx ts-node migrations/v1__import_from_csv.tsx DBKLP_Lubos.csv
 */

const getAuthorsIDandUnique = async (authors: string[], isbn: string, role: string) => {
    try {
        if (!authors) return;

        const foundAuthors = [];

        for (let author of authors) {
            author = author
                .replace(/\\/g, "")
                .replace(/'/g, "")
                .replace(/"/g, "")
                .replace(/,/g, "")
                .trim();
            const splitted = author.split(" ");
            let firstName = "";
            let lastName = "";

            if (splitted.length < 1) return;

            // here it is reversed - last name is first, then first name
            // if name consist of only one word
            if (splitted.length === 1) {
                lastName = splitted[0];
            } else {
                firstName = splitted[splitted.length - 1];
                lastName = splitted.slice(0, splitted.length - 1).join();
            }

            if (!lastName) return;

            let queryOptions: any = [
                {
                    lastName: {
                        $regex: `^${lastName.replace(/ová$/i, '')}(ová)?$`,
                        $options: 'i'
                    }
                }
            ];

            if (firstName.length > 0) {
                const firstNameConditions = [
                    {firstName: firstName}
                ];

                if (!firstName.includes(".")) {
                    firstNameConditions.push({
                        firstName: firstName
                            ?.split(" ")
                            .map(word => word[0] + ". ")
                            .join("")
                            .trim()
                    });
                }

                queryOptions = [
                    {
                        $and: [
                            queryOptions[0], // Prioritize lastName condition
                            {$or: firstNameConditions} // Include firstName conditions only when lastName matches
                        ]
                    },
                    ...queryOptions // Fall back to matching lastName alone
                ];
            }

            //console.log(`Found ${firstName} ${lastName}`);
            //console.log(queryOptions);
            let foundAuthor = await Autor.findOne({$or: queryOptions}).collation({locale: "cs", strength: 1});

            if (!foundAuthor) {
                foundAuthor = await Autor.create({firstName: firstName, lastName: lastName, role: role});
            } else {
                if (!foundAuthor.role?.includes(role)) {
                    await Autor.findByIdAndUpdate(
                        {_id: foundAuthor._id},
                        {
                            ...foundAuthor,
                            role: [...foundAuthor.role ?? [], role],
                        }
                    )
                }
            }

            //cleaning obj, so there is no hidden params from Mongo
            foundAuthors.push({
                _id: foundAuthor._id,
                lastName: foundAuthor.lastName,
                firstName: foundAuthor.firstName,
                fullName: `${foundAuthor.lastName ?? ""}${foundAuthor.firstName ? ", " + foundAuthor.firstName : ""}`,
            });


        }
        // remove duplicates
        return foundAuthors.filter((doc, index, self) =>
            index === self.findIndex(d => d.firstName === doc.firstName && d.lastName === doc.lastName)
        );
    } catch (err) {
        console.error("Error while finding autors for ", isbn);
    }
};

const createBook = async (row: string[], owner: string) => {
    try {
        const autors = [
            row[0],
            row[1],
            row[2],
            row[3],
            row[4],
            row[5],
            row[6],
            row[7],
            row[8],
            row[9]
        ].filter((row) => row !== "");

        const editors = row[10].split(";");
        const translators = row[12].split(";");
        const ilustrators = row[11].split(";");

        const enrichedAuthors = await getAuthorsIDandUnique(autors, row[19], AutorRole.AUTOR);
        const enrichedTranslator = await getAuthorsIDandUnique(translators, row[19], AutorRole.TRANSLATOR);
        const enrichedIlustrators = await getAuthorsIDandUnique(ilustrators, row[19], AutorRole.ILUSTRATOR);
        const enrichedEditors = await getAuthorsIDandUnique(editors, row[19], AutorRole.EDITOR);

        //console.log(autors, translators, ilustrators, editors);
        //console.log(row.map((val, index) => `${index} ${val}`));

        const readBy = [];
        if (owner === "619800d46aba58b905cc2455") { //Lubos
            if (row[23] !== "") {
                readBy.push("619800d46aba58b905cc2455");//Lubos
            }
            if (row[24] !== "") {
                readBy.push("619802656aba58b905cc245e");
            }
        } else {
            if (row[24] !== "") {
                readBy.push("619800d46aba58b905cc2455");//Lubos
            }
            if (row[23] !== "") {
                readBy.push("619802656aba58b905cc245e");
            }
        }

        let city: string | undefined = undefined;

        switch (row[31]) {
            case "Spišská":
                city = "spisska";
                break;
            case "Ostrava":
            case "Břuchotín":
                city = "bruchotin";
                break;
            default:
                city = undefined;
        }

        const book = {
            title: row[13],
            autor: enrichedAuthors,
            translator: enrichedTranslator,
            ilustrator: enrichedIlustrators,
            editor: enrichedEditors,
            content: row[14],
            ISBN: row[19],
            published: {
                publisher: row[20],
                year: row[21],
                country: row[22],
            },
            numberOfPages: row[29],
            note: row[25],
            language: row[22].replace(" ", "").split("/"),
            serie: {
                title: row[17],
                no: row[18],
            },
            dimensions: {
                height: row[26] ? parseFloat(row[26]) : undefined,
                width: row[27] ? parseFloat(row[27]) : undefined,
                depth: row[28] ? parseFloat(row[28]) : undefined,
            },
            edition: {
                title: row[15],
                no: row[16],
            },
            location: {
                city: city,
                shelf: undefined
            },
            exLibris: Boolean(row[30]),
            hrefDatabazeKnih: "",
            hrefGoodReads: "",
            picture: "",
            readBy: readBy,
            owner: owner,
            wasChecked: false
        }
        //console.log(book);
        await Book.create(book);
    } catch (err) {
        console.error("error while creating book", row[19]);
    }
}

const createLP = async (row: string[]) => {
    const splittedRow = row[0].split(";")
    const autors = splittedRow[0].split(",");

    const enrichedAutors = await getAuthorsIDandUnique(autors, splittedRow[1], AutorRole.MUSICIAN);

    const lp = {
        autor: enrichedAutors,
        title: splittedRow[1] || "",
        subtitle: splittedRow[2],
        edition: {
            title: splittedRow[4],
        },
        countLp: splittedRow[5],
        speed: splittedRow[6],
        publisher: {
            publisher: splittedRow[8],
            year: splittedRow[9],
            country: splittedRow[7]
        },
        language: splittedRow[10],
        note: splittedRow[11]
    }

    console.log(lp)

    try {
        await LP.create(lp);
    } catch (err) {
        console.error("error while creating LP", lp.title, err);
    }
}

const createQuote = async (row: string[]) => {
    let book: IBook | null = null;
    if (row[0]) {
        // 8071456071 becomes the regex 8-?0-?7-?1-?4-?5-?6-?0-?7-?1.
        const normalizedIsbn = new RegExp(
            row[0]
                .replace(/-/g, "")
                .split("")
                .join('-?'),
            "i");

        book = await Book.findOne({ISBN: normalizedIsbn});
    }

    const quote = {
        text: row[3].replace(/"{2,3}/g, '"'),
        fromBook: book ? book._id : undefined,
        pageNo: row[2] ? parseInt(row[2]) : undefined,
        owner: ["619800d46aba58b905cc2455"]
    }

    try {
        await Quote.create(quote);
    } catch (err) {
        console.error("error while creating Quote", quote.fromBook, err);
    }

}

const importFromCsv = () => {
    const filePath = process.argv[2];
    console.log("------------------------------");
    console.log("readCSV file", filePath);
    const fs = require('fs');

    // Add BOM handling and explicit encoding
    const options = {
        encoding: 'utf8',
        // This flag ensures we handle BOM correctly
        flag: 'r'
    };

    fs.readFile("data/" + filePath, options, async (err: Error, data: any) => {
        if (err) {
            console.error("Error reading file ", filePath, err);
            return;
        }

        // Remove BOM if present
        data = data.replace(/^\uFEFF/, '');

        // Normalize line endings
        data = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Split into rows, filter out empty lines
        const rows = data
            .split("\n")
            .filter((row: string) => row.trim().length > 0)
            .map((row: string) => {
                // Properly handle tab-delimited fields
                const fields = row.split("\t");
                // Trim whitespace from each field
                return fields.map(field => field.trim());
            });

        let processedCount = 0;
        const totalRows = rows.length;

        for (const [index, row] of rows.entries()) {
            // Update progress
            process.stdout.cursorTo(0);
            process.stdout.write(`Progress: ${index + 1} of ${totalRows}`);

            //if (index > 10) return process.exit(); //DEBUG

            try {
                switch (filePath) {
                    case "DBKLP_Lubos.csv":
                        await createBook(row, "619800d46aba58b905cc2455");
                        break;
                    case "DBKLP_Zaneta.csv":
                        await createBook(row, "619802656aba58b905cc245e");
                        break;
                    case "DBKLP_Jakub.csv":
                        await createBook(row, "62bb590bf7da6b9aaa2a3669");
                        break;
                    case "LP.csv":
                        await createLP(row);
                        break;
                    case "Quotes.csv":
                        await createQuote(row);
                        break;
                    default:
                        throw Error("Unknown file " + filePath);
                }
                processedCount++;
            } catch (error) {
                console.error('Row data:', row);
                // Continue with next row instead of stopping
                continue;
            }
        }

        console.log("===== FINISHED =======");
        process.exit();
    });
};

const app: Express = express()

const PORT: string | number = 4001

const uri: string = `mongodb+srv://Azarchaniel:lubos26csonka@cluster0.og6qo.mongodb.net/WebDBKLP?retryWrites=true&w=majority`;

mongoose.set("strictQuery", false);

mongoose
    .connect(uri)
    .then(() =>
        app.listen(PORT, () =>
            console.log(`Server running on http://localhost:${PORT}`)
        )
    )
    .catch((error) => {
        throw error
    })


importFromCsv();

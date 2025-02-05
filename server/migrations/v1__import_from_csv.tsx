import Autor from "../src/models/autor";
import mongoose from "mongoose";
import express, {Express} from "express";
import Book from "../src/models/book";
import LP from "../src/models/lp";
import Quote from "../src/models/quote";
import {IBook} from "../src/types";

/**
 * HOW TO RUN:
 * npx ts-node migrations/v1__import_from_csv.tsx DBKLP_Lubos.csv
 */

const getAuthorsIDandUnique = async (authors: string[]) => {
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

        console.log(`Found ${firstName} ${lastName}`);
        console.log(queryOptions);
        let foundAuthor = await Autor.findOne({$or: queryOptions}).collation({locale: "cs", strength: 1});

        if (!foundAuthor) {
            foundAuthor = await Autor.create({firstName: firstName, lastName: lastName});
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
};

const createBook = async (row: string[], owner: string) => {
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

    const translators = row[10].split(";");
    const ilustrators = row[11].split(";");

    const enrichedAuthors = await getAuthorsIDandUnique(autors);
    const enrichedTranslator = await getAuthorsIDandUnique(translators);
    const enrichedIlustrators = await getAuthorsIDandUnique(ilustrators);

    console.log(autors, translators, ilustrators);

    const book = {
        title: row[14],
        autor: enrichedAuthors,
        translator: enrichedTranslator,
        ilustrator: enrichedIlustrators,
        ISBN: row[20],
        published: {
            publisher: row[21],
            year: row[22],
            country: row[23],
        },
        numberOfPages: row[30],
        language: row[23],
        serie: {
            title: row[18],
            no: row[19],
        },
        edition: {
            title: row[16],
            no: row[17],
        },
        hrefDatabazeKnih: "",
        hrefGoodReads: "",
        picture: "",
        owner: owner
    }
    console.log(book);

    try {
        console.log("creating book", );
        await Book.create(book);
    } catch (err) {
        console.error("error while creating book", book.ISBN, err);
    }
}

const createLP = async (row: string[]) => {
    const splittedRow = row[0].split(";")
    const autors = splittedRow[0].split(",");

    //FIXME: most of the authors have reversed names
    const enrichedAutors = await getAuthorsIDandUnique(autors);

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
    const splittedRow = row[0].split(";")

    let book: IBook | null = null;
    if (splittedRow[0]) {
        // 8071456071 becomes the regex 8-?0-?7-?1-?4-?5-?6-?0-?7-?1.
        const normalizedIsbn = new RegExp(
            splittedRow[0]
                .replace(/-/g, "")
                .split("")
                .join('-?'),
        "i");

        book = await Book.findOne({ISBN: normalizedIsbn});
    }

    const quote = {
        text: splittedRow[3],
        fromBook: book ? book._id : undefined,
        pageNo: splittedRow[2],
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
    console.log("------------------------------")
    console.log("readCSV file", filePath);
    const fs = require('fs');

    fs.readFile("data/" + filePath, 'utf8', async (err: Error, data: any) => {
        if (err) {
            console.error("Error reading file ", filePath, err);
            return;
        }

        const rows = data.split("\n").map((row: string) => row.split("\t"));

        for (const row of rows) {
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
        }

        console.log("===== FINISHED =======")
        process.exit();
    })

}

const app: Express = express()

const PORT: string | number = 4001

const uri: string = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.og6qo.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

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

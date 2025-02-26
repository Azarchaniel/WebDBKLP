import Book from "../src/models/book";
import {IBook} from "../src/types";
import mongoose from "mongoose";
import {connectDBforMigration} from "./premigration";
import fs from "fs";

const parseToDecimal128 = (value: string) => {
    if (!value) {
        return null; // Handle empty or undefined values
    }

    // Replace comma with a period for proper parsing
    value = value.replace(",", ".");

    // Parse the value and ensure it’s a valid number
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        return null; // Handle invalid numbers
    }

    // Convert to Decimal128 using Mongoose's method
    return mongoose.Types.Decimal128.fromString(parsed.toString());
};

const areSameType = (...values: (mongoose.Types.Decimal128 | null)[]) => {
    const allNull = values.every(value => value === null);
    const allNumbers = values.every(value => value !== null);
    return allNull || allNumbers;
};


const importCsv = () => {
    try {
        console.log("fix dimensions");

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

        // errors
        const foundTooMany: string[] = [];
        const noBookFound: string[] = [];
        const incosistentDimensions: string[] = [];
        const crashError: string[] = [];

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

            const totalRows = rows.length;

            for (const [index, row] of rows.entries()) {
                // Update progress
                process.stdout.cursorTo(0);
                process.stdout.write(`Progress: ${index + 1} of ${totalRows}`);

                //DEBUG
                //if (index > 10) break;

                const ISBN = row[19];
                const title = row[13];
                const height = parseToDecimal128(row[26]);
                const width = parseToDecimal128(row[27]);
                const depth = parseToDecimal128(row[28]);

                let book: IBook[] = [];
                if (ISBN) {
                    book = await Book.find({ ISBN: ISBN, deletedAt: { $exists: false }});
                }

                if (!book.length) {
                    book = await Book.find({ title: title, deletedAt: { $exists: false }});
                }

                if (book.length > 1)
                    foundTooMany.push(ISBN ?? title);

                if (book.length === 0)
                    noBookFound.push(ISBN ?? title);

                if (!areSameType(height, width, depth))
                    incosistentDimensions.push(ISBN ?? title);

                if (!book) {
                    console.error("No book found for ISBN: ", ISBN, title);
                    continue;
                }

                try {
                    await Book.findByIdAndUpdate(
                        {_id: book[0]?._id},
                        {
                            $set: {
                                dimensions: {
                                    height,
                                    width,
                                    depth,
                                },
                            },
                        },

                    )
                } catch (error) {
                    crashError.push(`${ISBN} ${title}`);
                }
            }

            console.log(` === FINISHED === `);
            console.log("Too many books found: ", foundTooMany);
            console.log("No book found: ", noBookFound);
            console.log("Incosistent dimensions: ", incosistentDimensions);
            console.log("Crash error: ", crashError);

            process.exit();
        });
    } catch (error) {
        console.error("Error in migration", error);
    }

}

connectDBforMigration();
importCsv();
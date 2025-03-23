import Book from "../src/models/book";
import {optionFetchAllExceptDeleted} from "../src/utils/constants";
import {webScrapper} from "../src/utils/utils";
import {connectDBforMigration} from "./premigration";
import {IBook} from "../src/types";

const addUrlAndPicture = async () => {
    const allBooks: IBook[] = await Book.find(
        {
            $and: [
                {
                    $or: [
                        { hrefDatabazeKnih: null },
                        { hrefDatabazeKnih: "" }
                    ]
                },
                {
                    $or: [
                        { hrefGoodReads: null },
                        { hrefGoodReads: "" }
                    ]
                },
                { $or: [{ picture: null }, { picture: "" }] }
            ],
            deletedAt: undefined,
            ISBN: {$exists: true}
        }
    ).select('_id ISBN');
    const totalRows = allBooks.length;

    const missingData: string[] = [];

    // @ts-ignore
    for (const [index, book] of allBooks.entries()) {
        process.stdout.cursorTo(0);
        process.stdout.write(`Progress: ${index + 1} of ${totalRows}`);
        if ("ISBN" in book) {
            const bookFound: IBook | null = await Book.findById(book._id);

            if (!bookFound) {
                missingData.push(book.ISBN!);
                continue;
            }

            if (!(bookFound.picture && bookFound.hrefDatabazeKnih && bookFound.hrefGoodReads)) {
                const data = await webScrapper(book.ISBN!);

                if (!data) {
                    missingData.push(book.ISBN!);
                    continue;
                }

                Book.findByIdAndUpdate(book._id, {
                    picture: data.picture,
                    hrefGoodReads: data.hrefGoodReads,
                    hrefDatabazeKnih: data.hrefDatabazeKnih,
                }).catch(err => console.error("error in book", book.ISBN, err));
            }
        }
    }
    process.stdout.write(`=== FINISHED JOB ===`);
    console.log(missingData);
    process.exit();
};

connectDBforMigration();
addUrlAndPicture();

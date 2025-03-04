import Book from "../src/models/book";
import {optionFetchAllExceptDeleted} from "../src/utils/constants";
import {webScrapper} from "../src/utils/utils";
import {connectDBforMigration} from "./premigration";
import {IBook} from "../src/types";

const addUrlAndPicture = async () => {
    const allBooks: IBook[] = await Book.find(optionFetchAllExceptDeleted).select('_id ISBN');
    const totalRows = allBooks.length;

    for (const [index, book] of allBooks.entries()) {
        process.stdout.cursorTo(0);
        process.stdout.write(`Progress: ${index + 1} of ${totalRows}`);
        if ("ISBN" in book) {
            const data = await webScrapper(book.ISBN!);
            Book.findByIdAndUpdate(book._id, {
                picture: data.picture,
                hrefGoodReads: data.hrefGoodReads,
                hrefDatabazeKnih: data.hrefDatabazeKnih,
            }).catch(err => console.error("error in book", book.ISBN, err));
        }
    }
};

connectDBforMigration();
addUrlAndPicture();
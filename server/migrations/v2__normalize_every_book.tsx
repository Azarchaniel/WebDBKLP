import mongoose from 'mongoose';
import Book from '../src/models/book';
import {connectDBforMigration} from "./premigration";

/**
 * HOW TO RUN:
 * npx ts-node migrations/v2__normalize_every_book.tsx
 */

async function normalizeAllBooks() {
    try {
        // Fetch all books
        const books = await Book.find({}); // Optionally add filters if needed

        console.log(`Found ${books.length} books. Normalizing...`);

        // Iterate through each book and trigger update
        for (const [index, book] of books.entries()) {
            process.stdout.cursorTo(0);
            process.stdout.write(`Progress: ${index + 1} of ${books.length}`);

            // Use findOneAndUpdate to trigger the middleware
            await Book.findOneAndUpdate(
                { _id: book._id },
                { $set: { updatedAt: new Date() } } // Set a dummy update field to trigger the middleware
            );
        }

        console.log(`Normalization complete for ${books.length} books.`);
    } catch (error) {
        console.error("Error normalizing books", error);
        await mongoose.disconnect();
    }
}

connectDBforMigration();
// Execute the script
normalizeAllBooks().finally(() => {
    console.log("==== JOB FINISHED =======")
    mongoose.disconnect().then(() => process.exit(1));
    process.exit(1);
});

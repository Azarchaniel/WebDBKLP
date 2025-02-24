import mongoose from 'mongoose';
import Book from '../src/models/book';
import express, {Express} from "express";

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

try {
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
} catch (err) {
    console.error(
        "Error while normalizing books",
        err)
    mongoose.disconnect().then(() => process.exit(1));
}

// Execute the script
normalizeAllBooks().finally(() => {
    console.log("==== JOB FINISHED =======")
    mongoose.disconnect().then(() => process.exit(1));
    process.exit(1);
});

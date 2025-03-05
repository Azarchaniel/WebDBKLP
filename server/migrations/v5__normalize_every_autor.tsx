import mongoose from 'mongoose';
import {connectDBforMigration} from "./premigration";
import Autor from "../src/models/autor";

/**
 * HOW TO RUN:
 * npx ts-node migrations/v5__normalize_every_autor.tsx
 */

async function normalizeAllAutors() {
    try {
        // Fetch all autors
        const autors = await Autor.find({}); // Optionally add filters if needed

        console.log(`Found ${autors.length} autors. Normalizing...`);

        // Iterate through each autor and trigger update
        for (const [index, autor] of autors.entries()) {
            process.stdout.cursorTo(0);
            process.stdout.write(`Progress: ${index + 1} of ${autors.length}`);

            // Use findOneAndUpdate to trigger the middleware
            await Autor.findOneAndUpdate(
                { _id: autor._id },
                { $set: { updatedAt: new Date() } } // Set a dummy update field to trigger the middleware
            );
        }

        console.log(`Normalization complete for ${autors.length} autors.`);
    } catch (error) {
        console.error("Error normalizing autors", error);
        await mongoose.disconnect();
    }
}

connectDBforMigration();
// Execute the script
normalizeAllAutors().finally(() => {
    console.log("==== JOB FINISHED =======")
    mongoose.disconnect().then(() => process.exit(1));
    process.exit(1);
});

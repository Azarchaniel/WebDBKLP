import mongoose from 'mongoose';
import {connectDBforMigration} from "./premigration";
import Autor from "../src/models/autor";

/**
 * HOW TO RUN:
 * npx ts-node migrations/v6__add_fullName_to_autor.tsx
 */

async function addFullNameToAutors() {
    try {
        // Fetch all autors
        const autors = await Autor.find({});

        console.log(`Found ${autors.length} autors. Adding fullName...`);

        for (const [index, autor] of autors.entries()) {
            process.stdout.cursorTo(0);
            process.stdout.write(`Progress: ${index + 1} of ${autors.length}`);

            await Autor.findOneAndUpdate(
                { _id: autor._id },
                { $set: { fullName: `${autor.lastName ?? ""}${autor.firstName ? ", " + autor.firstName : ""}` } } // Set a dummy update field to trigger the middleware
            );
        }

        console.log(`Add name complete for ${autors.length} autors.`);
    } catch (error) {
        console.error("Error adding name to autors", error);
        await mongoose.disconnect();
    }
}

connectDBforMigration();
// Execute the script
addFullNameToAutors().finally(() => {
    console.log("==== JOB FINISHED =======")
    mongoose.disconnect().then(() => process.exit(1));
    process.exit(1);
});

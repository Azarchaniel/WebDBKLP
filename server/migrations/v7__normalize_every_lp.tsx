import mongoose from 'mongoose';
import {connectDBforMigration} from "./premigration";
import Lp from "../src/models/lp";

/**
 * HOW TO RUN:
 * npx ts-node migrations/v7__normalize_every_lp.tsx
 */

async function normalizeAllLPs() {
    try {
        // Fetch all autors
        const lps = await Lp.find({}); // Optionally add filters if needed

        console.log(`Found ${lps.length} autors. Normalizing...`);

        // Iterate through each autor and trigger update
        for (const [index, lp] of lps.entries()) {
            process.stdout.cursorTo(0);
            process.stdout.write(`Progress: ${index + 1} of ${lps.length}`);

            // Use findOneAndUpdate to trigger the middleware
            await Lp.findOneAndUpdate(
                { _id: lp._id },
                { $set: { updatedAt: new Date() } } // Set a dummy update field to trigger the middleware
            );
        }

        console.log(`Normalization complete for ${lps.length} autors.`);
    } catch (error) {
        console.error("Error normalizing autors", error);
        await mongoose.disconnect();
    }
}

connectDBforMigration();
// Execute the script
normalizeAllLPs().finally(() => {
    console.log("==== JOB FINISHED =======")
    mongoose.disconnect().then(() => process.exit(1));
    process.exit(1);
});

import mongoose from 'mongoose';
import diacritics from 'diacritics';
import { connectDBforMigration } from "./premigration";

/**
 * HOW TO RUN:
 * npx ts-node migrations/v8__normalize_every_quote.tsx
 *
 * Uses a minimal schema to avoid circular-dependency crashes that occur when
 * importing the full Quote model (quote -> baseSchema -> utils -> Autor -> baseSchema).
 */

// Minimal loose schema — no middleware, no circular deps
const QuoteSchema = new mongoose.Schema({}, { strict: false });
const Quote = mongoose.model('Quote', QuoteSchema);

function normalizeText(value: string | undefined | null): string {
    return diacritics
        .remove(value ?? '')
        .replace(/[^a-zA-Z0-9\s]/g, '');
}

async function normalizeAllQuotes() {
    try {
        const quotes = await Quote.find({}).select('_id text note').lean();

        console.log(`Found ${quotes.length} quotes. Normalizing...`);

        for (const [index, quote] of quotes.entries()) {
            if (process.stdout.cursorTo) process.stdout.cursorTo(0);
            process.stdout.write(`Progress: ${index + 1} of ${quotes.length}`);

            const normalizedSearchField: Record<string, string> = {};

            const text = normalizeText((quote as any).text);
            if (text) normalizedSearchField.text = text;

            const note = normalizeText((quote as any).note);
            if (note) normalizedSearchField.note = note;

            await Quote.updateOne(
                { _id: quote._id },
                { $set: { normalizedSearchField } }
            );
        }

        console.log(`\nNormalization complete for ${quotes.length} quotes.`);
    } catch (error) {
        console.error("Error normalizing quotes", error);
        await mongoose.disconnect();
    }
}

connectDBforMigration();
// Execute the script
normalizeAllQuotes().finally(() => {
    console.log("==== JOB FINISHED =======")
    mongoose.disconnect().then(() => process.exit(1));
    process.exit(1);
});


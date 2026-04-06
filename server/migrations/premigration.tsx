import express, { Express } from "express";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load env vars from nodemon.json so migrations work without nodemon
const nodemonConfig = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../nodemon.json"), "utf-8")
);
Object.entries(nodemonConfig.env ?? {}).forEach(([key, value]) => {
    if (!process.env[key]) process.env[key] = value as string;
});

export const connectDBforMigration = () => {
    const app: Express = express()

    const PORT: string | number = 4001

    const uri: string = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

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
};
import express, {Express} from "express";
import mongoose from "mongoose";

export const connectDBforMigration = () => {
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
};
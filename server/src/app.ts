import express, {Express} from "express"
import mongoose from "mongoose"
import cors from "cors"
import routes from "./routes"
import path from "path";

const app: Express = express()

const PORT: string | number = process.env.PORT || 4000

const allowedOrigins = ["http://localhost:3000", "https://webdbklp.onrender.com"];
app.use(
    cors({
        origin: function (origin, callback) {
            // Check if the incoming origin is in the whitelist (allow listed origins)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS not allowed for origin: ${origin}`));
            }
        },
        credentials: true, // Allow cookies and credentials
    })
);


app.use(express.json({limit: "20mb"}));
app.use(express.urlencoded({limit: "20mb", extended: true}));
app.use(routes)

app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

const uri: string = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.og6qo.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`

mongoose.set("strictQuery", false);
console.log("MongoDB URI: " + uri);

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

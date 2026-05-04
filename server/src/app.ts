import express, { Express, Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import cors from "cors"
import cookieParser from "cookie-parser"
import routes from "./routes"
import path from "path";

const app: Express = express()

const PORT: string | number = process.env.PORT || 4000;
const useLocalDbMirror = process.env.USE_LOCAL_DB_MIRROR === "true";
const databaseName = useLocalDbMirror
    ? process.env.MONGO_DB_LOCAL || process.env.MONGO_DB
    : process.env.MONGO_DB;

const allowedOrigins = ["http://localhost:3000", "https://webdbklp.onrender.com"];
app.use(
    cors({
        origin: function (origin, callback) {
            // Block requests with no origin in production (e.g. curl, server-to-server)
            if (!origin) {
                if (process.env.NODE_ENV !== 'production') {
                    return callback(null, true);
                }
                return callback(new Error('CORS: missing origin'));
            }
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS not allowed for origin: ${origin}`));
            }
        },
        credentials: true, // Allow cookies and credentials
    })
);


app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));
app.use(routes)

app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// Global error handler — catches unhandled errors from async route handlers
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

const uri: string = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.og6qo.mongodb.net/${databaseName}?retryWrites=true&w=majority`

mongoose.set("strictQuery", false);
//console.log("MongoDB URI: " + uri);

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

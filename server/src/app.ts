import express, {Express} from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import routes from './routes'

const app: Express = express()

const PORT: string | number = process.env.PORT || 4000

app.use(express.json({limit: '20mb'}));
app.use(express.urlencoded({limit: '20mb'}));
app.use(cors())
app.use(routes)

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

import * as fs from "fs";

const importBooksFromFile = () => {
    fs.readFile("../uploads/books.csv", (err, data) => {
        if (err) {
            console.error("Cant read file")
            return;
        }
        console.log(data);
        //https://c2fo.github.io/fast-csv/docs/introduction/example
    })
}
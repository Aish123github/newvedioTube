import dotenv from "dotenv";
import "dotenv/config";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config(
    { path: "./.env" }
);
// if the  variable PORT is not defined in the .env file, it will default to 8001
// if the variable is comming from env variable then it will take that value 8000
const PORT = process.env.PORT || 8001;


connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    }).catch((error) => {
        console.error("Error connecting to the database:", error)
    })

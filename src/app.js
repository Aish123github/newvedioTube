import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors(
    {origin : process.env.CORS_ORIGIN,
        credentials : true
    }
));
// common middlewares
app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({limit:"16kb", extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

// importing routes
import healthCheckRoutes from "./routes/healthcheck.routes.js";
import userRoutes from "./routes/user.routes.js";
import {errorHandler} from "./middlewares/errors.middlewares.js";
// routes
app.use("/api/v1/healthcheck", healthCheckRoutes);// it means when we hit the /healthcheck endpoint it will call the healthCheck controller function and return the response
app.use("/api/v1/users", userRoutes);// it means when we hit the /user endpoint it will call the user controller function and return the response

//app.use(errorHandler);// error handler middleware should be the last middleware in the middleware stack because it will catch all the errors that are thrown in the previous middlewares and send the response to the client
//routes


export { app };
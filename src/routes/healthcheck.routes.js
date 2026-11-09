import {Router} from "express";

import { healthCheck } from "../controllers/healthcheck.controllers.js";

import {upload} from "../middlewares/multer.middleware.js";
const router = Router();

 // it means when we hit the /healthcheck endpoint it will call the healthCheck controller function and return the response

 router.route("/").get(healthCheck);
export default router;
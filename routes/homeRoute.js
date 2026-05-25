const express = require("express");
const homeRouter = express.Router();
const homeController = require("../controllers/homePageController");
homeRouter.get("/", homeController.homePage);
homeRouter.post("/api/contact", homeController.submitContact);
module.exports = homeRouter;

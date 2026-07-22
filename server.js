require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const homeRouter = require("./routes/homeRoute");
const adminRouter = require("./routes/adminRoute");
const { connectDB, getDB } = require("./config/dataBase");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", 1); // Trust reverse proxy in production (e.g., Render)
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: process.env.DB_NAME,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Global middleware for EJS variables
app.use(async (req, res, next) => {
  let admin = req.session.admin || null;
  if (admin && admin.email !== process.env.ADMIN_EMAIL) {
    admin = null;
  }
  res.locals.admin = admin;

  try {
    await connectDB();
    const db = getDB();
    if (db) {
      res.locals.owner = await db.collection("adminData").findOne({});
    } else {
      res.locals.owner = null;
    }
  } catch (e) {
    res.locals.owner = null;
  }

  next();
});

app.use(homeRouter);
app.use("/admin", adminRouter);

if (process.env.VERCEL) {
  module.exports = app;
} else {
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`server is listning on port:${port}`);
    });
  });
}

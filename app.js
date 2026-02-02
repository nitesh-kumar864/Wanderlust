const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');


if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

//  middleware 
app.use((req, res, next) => {
  res.locals.LOCATION_IQ_TOKEN = process.env.LOCATION_IQ_TOKEN || "";
  next();
});

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const pageRouter= require("./routes/pages.js");

const dbURL = process.env.MONGODB_URL;

// DATABASE CONNECTION
main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log("DB Error:", err));

async function main() {
  await mongoose.connect(`${dbURL}/wanderlust`);
}

const store = MongoStore.create({
  mongoUrl: `${dbURL}/wanderlust`,
  touchAfter: 24 * 3600, // 1 day
});

store.on("error", function(err) {
  console.log("SESSION STORE ERROR", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};


// APP + MIDDLEWARE
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//  Flash + User middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.use((req, res, next) => {
  res.locals.LOCATION_IQ_TOKEN = process.env.LOCATION_IQ_TOKEN || "";
  next();
});

// ROUTES USE
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/", pageRouter);

// ERROR HANDLING
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// SERVER
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

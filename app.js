let createError = require("http-errors");
const fs = require("fs");
const http = require("http");
let express = require("express");
let session = require("express-session");
let path = require("path");
let cookieParser = require("cookie-parser");
let logger = require("morgan");
let db = require("./config/mongodb");
let cors = require("cors");
require("dotenv").config();
const bodyparser = require("body-parser");
let app = express();

const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

let indexRouter = require("./routes/index");
let adminRouter = require("./routes/users");
const { errorHandler, portRunning } = require("./middleware/middleware");
const { socketConnect } = require("./socketController/socketController");

app.set("view engine", "jade");

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("connected succesfully ");
  }
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyparser.json());
app.use(
  session({
    secret: process.env.SECRET_CODE,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use("/admin", adminRouter);
app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(errorHandler);

io.on("connection",socketConnect);

server.listen(5000, portRunning);

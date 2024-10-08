var createError = require("http-errors");
var express = require("express");
var path = require("path");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const expressSession = require("express-session");
const flash = require("connect-flash");
const userModel = require("./routes/users");
var checkFriendship = require("./routes/index");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const passport = require("passport");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const { connection } = require("mongoose");
const io = new Server(server);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(flash());
app.use(
  expressSession({
    secret: "IDKidontknow", // Replace with a random string (used to sign the session ID cookie)
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure to true if your site uses HTTPS
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(userModel.createStrategy());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/uploadChatFile", checkFriendship);

// // Socket.io setup

var usp = io.of("/user-namespace");
usp.on("connection", async function (socket) {
  console.log("user connected");
  var userId = socket.handshake.auth.token;
  await userModel.findByIdAndUpdate(
    { _id: userId },
    { $set: { is_online: "1" } }
  );
  //broadcasting online or offline users for real time
  socket.broadcast.emit("getOnlineUser", { user_id: userId });
  socket.on("disconnect", async function () {
    console.log("user disconnected");
    var userId = socket.handshake.auth.token;
    await userModel.findByIdAndUpdate(
      { _id: userId },
      { $set: { is_online: "0" } }
    );
    //broadcasting online or offline users for real time
    socket.broadcast.emit("getofflineUser", { user_id: userId });
  });
  //chatting implementation
  socket.on("newChat", function (data) {
    socket.broadcast.emit("loadNewChat", data);
  });
  // Handle message deletion broadcasting
  socket.on("messageDeleted", function (data) {
    socket.broadcast.emit("loadMessageDeleted", data);
  });
  // Handle new message event
  socket.on("newMessage", function (message) {
    console.log(message);
    io.of("/user-namespace")
      .to(message.groupId)
      .emit("messageReceived", message);
    // console.log("message:",message);
    socket.broadcast.emit('messageReceived',message);
  });
  socket.on("groupMessageDeleted",function(data){
    console.log("server side",data);
    socket.broadcast.emit('loadGroupMessageDeleted',data);
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = { app, server };

var createError = require('http-errors');
var express = require('express');
var path = require('path');
// const http = require("http");
// const mongoose = require("mongoose");
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const expressSession = require('express-session');
const flash= require("connect-flash");
const userModel = require("./routes/users");
// const socketIo = require("socket.io");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const passport = require("passport");

var app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// mongoose.connect("mongodb://127.0.0.1:27017/courseMatch", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());
app.use(expressSession({
  secret: 'IDKidontknow', // Replace with a random string (used to sign the session ID cookie)
  resave:false,
  saveUninitialized:false,
  cookie: { secure: false } // Set secure to true if your site uses HTTPS

  // cookie: {
    // maxAge: 60 * 60 * 1000, // Session timeout in milliseconds (1 hour in this example)
    // Other cookie options such as secure: true if using HTTPS
  // }
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(userModel.createStrategy());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

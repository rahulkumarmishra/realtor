var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const http = require('http');

var indexRouter = require('./routes/admin');
var apiRouter = require('./routes/api');

const session = require('express-session');
const flash = require('express-flash');
const fileUpload = require('express-fileupload');
const db = require('./models');
const sessionHelper = require('./helper/session_helper');

var app = express();
app.use(fileUpload());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('trust proxy', 1);
app.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 365 * 1000,
  }
}))

app.use(flash());
app.use(sessionHelper);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const PORT = process.env.PORT || 3036;

const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
require('./socket.js')(io);


server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})

module.exports = app;

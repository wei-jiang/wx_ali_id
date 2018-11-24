const fs = require('fs');
const path = require('path');
const app = require('express')();
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const xmlparser = require('express-xml-bodyparser');
const request = require('request-promise-native');
const _ = require('lodash');
const uuidv1 = require('uuid/v1');
const moment = require('moment');
require('log-timestamp')(()=> `[${moment().format('YYYY-MM-DD HH:mm:ss SSS')}] %s`);
const mongo = require('mongodb'), MongoClient = mongo.MongoClient, ObjectId = mongo.ObjectID, Binary = mongo.Binary;
const cfg = require('./secret');
const aliapi = require('./dealer/aliapi');
const wxapi = require('./dealer/wxapi');
global.m_db = null;

app.set('port', process.env.PORT || 7799);
nunjucks.configure('views', {
  autoescape: true,
  express: app
});
app.use(session({
  secret: cfg.session_key,
  store: new MongoStore({
    url: cfg.db_url,
    // ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    ttl: 2 * 24 * 60 * 60,
    touchAfter: 24 * 3600 // time period in seconds
  }),
  resave: false,
  saveUninitialized: false
}));
app.use(require('express').static(__dirname + '/public'));
app.use(helmet());
// app.use(cors());
app.use(xmlparser());
app.use(cookieParser());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
MongoClient.connect(cfg.db_url, { useNewUrlParser: true })
  .then(client => {
    m_db = client.db(cfg.db_name);
    m_db.collection('notification').createIndex({ "createdAt": 1 }, { expireAfterSeconds: 24 * 3600 })
    console.log('connect to mongodb(ccb) success')
    server.listen(app.get('port'), 'localhost', () => {
      console.log("Express server listening on port " + app.get('port'));
    });
  })
  .catch(err => console.log('connect to mongodb(ccb) failed', err))

aliapi.init(app);
wxapi.init(app);

app.post('/notify', function (req, res) {
  if (!req.body) return res.sendStatus(400);

  // console.log(data)
  res.end('SUCCESS');
});
app.get('/uid', (req, res) => {
  const ua = req.get('user-agent')
  // console.log(ua);
  if (/MicroMessenger/i.test(ua)) {
    wxapi.handle_uid(req, res);
  } else if (/Alipay/i.test(ua)) {
    aliapi.handle_uid(req, res);
  } else {
    let rurl = req.query.rurl;
    if (!rurl) {
        return res.end('no return url');
    }
    const sess = req.session
    if (!sess.session_id) {
      sess.session_id = uuidv1();
      // console.log('initialize session_id=' + sess.session_id)
    } else {
      // console.log('already has session_id=' + sess.session_id)
    }    
    rurl = `${rurl}?session_id=${sess.session_id}`;
    res.redirect(rurl);
  }
});

app.get('/test', function (req, res) {
  let data = req.query
  console.log('/in get /test data=' + JSON.stringify(data));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(JSON.stringify(data));
});
app.post('/test', function (req, res) {
  let data = req.body
  console.log('/in post /test data=' + JSON.stringify(data));
  res.end(JSON.stringify(data));
});

io.on('connection', function (socket) {
  socket.on('cmbc_qr_pay', function (data, fn) {


  });

  socket.on('enable_ssm_or_not', function (data) {

  });
});
var Promise = require("bluebird");
var MongoClient = require('mongodb').MongoClient;
var readFile = Promise.promisify(require("fs").readFile);
var nodemailer = require("nodemailer");
var xoauth = require('xoauth2');
var transporter;

function setupNodeMailer(Config) {
  var generator = xoauth.createXOAuth2Generator({
    user: Config.email.username,
    clientId: Config.email.clientid,
    clientSecret: Config.email.clientsecreat,
    refreshToken: Config.email.refreshtoken
  })
  transporter = nodemailer.createTransport(({
    service: 'gmail',
    auth: {
      xoauth2: generator
    }
  }));
  return Config;
}

function getAllSubscriber(Config) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(Config.mongoURIStaging, (err, db) => {
      if (err) {
        reject(err)
      }
      db.collection("subscribers", function(err, Subscribers) {
        if (err) {
          reject(err)
        }
        Subscribers.find().toArray((err, subscribers) => {
          if (err) {
            reject(err)
          }
          resolve(subscribers)
        })
      })
    });
  })
}

function sendEmailToAll(subscribers) {
  subscribers = subscribers.map((subscriber) => {
    return Promise.fromCallback((cb) => {
      var mailOptions = {
        to: subscriber.email,
        from: 'info@17wanzy.com',
        subject: 'Hello ✔',
        text: 'Hello world 🐴',
        html: '<b>Hello world 🐴</b>'
      };
      transporter.sendMail(mailOptions, function(err) {
        if (err) {
          return cb(null, `Did't send to ${subscriber.email}. Error reason: ${err.message}`)
        }
        cb(null, `send mail to ${subscriber.email}`)
      });
    })
  })
  return Promise.all(subscribers)
}

readFile('config.json', 'utf8')
  .then(JSON.parse)
  .then(setupNodeMailer)
  .then(getAllSubscriber)
  .then(sendEmailToAll)
  .then(console.log)
  .catch(console.error)

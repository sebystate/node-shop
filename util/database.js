const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
  MongoClient.connect(
    'mongodbClusterString'
  )
    .then((client) => {
      console.log('Successfully connected to Atlas MongoDB!');
      _db = client.db();
      callback();
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const getDb = () => {
  if (_db) {
    return _db;
  } 
  throw 'No database found!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

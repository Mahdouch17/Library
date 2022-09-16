// const sqlite3 = require("sqlite3").verbose();
// var path = require("path");
// const db_name = path.join(__dirname, "apptest.db");
// const db = new sqlite3.Database(db_name, (err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log("Successful connection to the database 'apptest.db'");
// });

// const sql = "SELECT * FROM Books ORDER BY id";

// db.all(sql, [], (err, rows) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   getBooks(rows);
// });

// function getBooks(books) {
//   console.log(books);
// }

// const books = getBooks(rows);
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
var sqlite3 = require("sqlite3").verbose();
exports.readBooks = function (callback) {
  var path = require("path");
  const db_name = path.join(__dirname, "apptest.db");
  const db = new sqlite3.Database(db_name);
  db.serialize(function () {
    db.all("SELECT * FROM Books", function (err, rows) {
      if (err != null) {
        console.log(err);
        callback(err);
      }
      callback(rows);
      db.close();
    });
  });
};

async function db_all(query) {
  return new Promise(function (resolve, reject) {
    db.all(query, function (err, rows) {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}


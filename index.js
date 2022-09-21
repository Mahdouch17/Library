"use strict";

/**
 * Module dependencies.
 */
// import pkg from "./database.js";
// const { readRecordsFromMediaTable } = pkg;
// import {books} from "./database";
var database = require("./database");
const sqlite3 = require("sqlite3").verbose();
var express = require("express");
var path = require("path");
const db_name = path.join(__dirname, "apptest.db");
const db = new sqlite3.Database(db_name, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log("Successful connection to the database 'apptest.db'");
});

const sql_create_books = `CREATE TABLE IF NOT EXISTS Books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  authorId INTEGER,
  editionId INTEGER,
  categoryId INTEGER,
  language TEXT,
  FOREIGN KEY (authorId) 
      REFERENCES Authors (id)
  FOREIGN KEY (editionId) 
      REFERENCES Editions (id)
  FOREIGN KEY (categoryId) 
      REFERENCES Categories (id)
);`;
const sql_insert_books = `INSERT INTO Books (id, title, authorId, editionId, categoryId, language) VALUES
(1, 'Good to Great: Why Some Companies Make the Leap... and Others Don''t', 1, 5, 1, 'en'),
(2, 'The Intelligent Investor', 2, 1, 3, 'en'),
(3, 'Built to Last: Successful Habits of Visionary Companies', 1, 4, 2, 'en'),
(4, 'Getting Things Done: The Art of Stress-Free Productivity', 3, 5, 1, 'en'),
(5, 'The E-Myth Revisited: Why Most Small Businesses Don''t Work and What to Do About It', 5, 2, 1, 'en'),
(6, 'The 7 Habits of Highly Effective People: Powerful Lessons in Personal Change', 4, 3, 3, 'en'),
(7, 'Making It All Work: Winning at the Game of Work and Business of Life', 3, 6, 1, 'en'),
(8, 'Mon livre', 1, 1, 1, 'fr');`;

const sql_create_authors = `CREATE TABLE IF NOT EXISTS Authors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  authorName TEXT,
  birthDate TEXT,
  deathDate TEXT,
  isInspector boolean
);`;

const sql_insert_authors = `INSERT INTO Authors (id, authorName, birthDate, deathDate, isInspector) VALUES
(1, 'James C. Collins', 'January 25, 1958', 'still alive', 0),
(2, 'Benjamin Graham', 'May 08, 1894', 'September 21, 1976', 1),
(3, 'David Allen', 'December 28, 1945', 'still alive', 1),
(4, 'Stephen R. Covey', 'October 24, 1932', 'July 16, 2012', 0),
(5, 'Michael E. Gerber', 'June 20, 1936', 'still alive', 0);`;

const sql_create_categories = `CREATE TABLE IF NOT EXISTS Categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoryName TEXT
);`;

const sql_insert_categories = `INSERT INTO Categories (id, categoryName) VALUES
(1, 'productivité'),
(2, 'Entreprenariat'),
(3, 'Développement personnel');`;

const sql_create_editions = `CREATE TABLE IF NOT EXISTS Editions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  editionName TEXT
);`;

const sql_insert_editions = `INSERT INTO Editions (id, editionName) VALUES
(1, '1949'),
(2, '1985'),
(3, '1988'),
(4, '1994'),
(5, '2001'),
(6, '2003');`;

const queriesTable = [
    sql_create_books,
    sql_insert_books,
    sql_create_authors,
    sql_insert_authors,
    sql_create_categories,
    sql_insert_categories,
    sql_create_editions,
    sql_insert_editions,
];
queriesTable.forEach((query) => {
    db.run(query, (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Successful query");
    });
});

var app = (module.exports = express());

app.engine(".html", require("ejs").__express);

// Optional since express defaults to CWD/views

app.set("views", path.join(__dirname, "views"));

// Path to our public directory

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({extended: false}));

// Without this you would need to
// supply the extension to res.render()
app.set("view engine", "html");

app.get("/", async (req, res) => {
    // const sql =
    //     "SELECT b.id, b.title, b.language, a.authorName, e.editionName, c.categoryName FROM (Books b JOIN Authors a ON b.authorId = a.id JOIN Editions e ON b.editionId = e.id JOIN Categories c ON b.categoryId = c.id)";
    // let result = {
    //   books: []
    // };
    const sql1 = "SELECT * FROM Books";
    const sql2 = "SELECT * FROM Authors";
    const sql3 = "SELECT * FROM Editions";
    const sql4 = "SELECT * FROM Categories";
    // db.all(sql, [], (err, rows) => {
    //   if (err) {
    //     return console.error(err.message);
    //   }
    //   rows.forEach(row => result.books.push(row));
    //   console.log(result.books);
    // });
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

    let books = await db_all(sql1);
    let authors = await db_all(sql2);
    let editions = await db_all(sql3);
    let categories = await db_all(sql4);
    let data = books.map(b => ({...authors.find(a => b.authorId === a.id), ...b}));
    let data1 = data.map(d => ({...editions.find(e => d.editionId === e.id), ...d}));
    let finalData = data1.map(d => ({...categories.find(c => d.categoryId === c.id), ...d}));
    let myTables = {books, authors, categories, editions};
    res.render("booksDetailed", {
        model: finalData,
        model2: myTables,
        title: "Liste des livres",
        page_name: "booksDetailed",
    });
});

app.get("/edit/:id", async (req, res) => {
    const id = req.params.id;
    // const sql =
    //     "SELECT b.id, b.title, b.language, a.authorName, e.editionName, c.categoryName FROM (Books b JOIN Authors a ON b.authorId = a.id JOIN Editions e ON b.editionId = e.id JOIN Categories c ON b.categoryId = c.id) WHERE b.id = ?";
    const sql1 = "SELECT * FROM Books WHERE id = ?";
    const sql2 = "SELECT * FROM Authors ORDER BY id";
    const sql3 = "SELECT * FROM Editions ORDER BY id";
    const sql4 = "SELECT * FROM Categories ORDER BY id";

    async function db_get(query) {
        return new Promise(function (resolve, reject) {
            db.get(query, id, function (err, row) {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    let book = await db_get(sql1);

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

    let authors = await db_all(sql2);
    let editions = await db_all(sql3);
    let categories = await db_all(sql4);
    let obj = {book, authors, editions, categories};
    // res.send(obj);
    res.render("edit", {
        model: obj,
        title: "Modification des informations du livre",
        page_name: "editBook",
    });
});

app.post("/edit/:id", (req, res) => {
    const id = req.params.id;
    const book = [
        req.body.Title,
        req.body.Author,
        req.body.Edition,
        req.body.Category,
        req.body.Language,
        id,
    ];

    const sql = "UPDATE Books SET (title,authorId,editionId,categoryId,language) = (?,?,?,?,?) WHERE (id = ?)";
    db.run(sql, book, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/");
    });
});

app.get("/create/", async (req, res) => {
    const sql = "SELECT * FROM Authors";
    const sql1 = "SELECT * FROM Editions";
    const sql2 = "SELECT * FROM Categories";

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

    let authors = await db_all(sql);
    let editions = await db_all(sql1);
    let categories = await db_all(sql2);
    let data = {authors, editions, categories};
    res.render("create", {
        model: data,
        title: "Ajout de livre",
        page_name: "addBook",
    });
});

app.post("/create/", (req, res) => {
    const sql = "INSERT INTO Books (title,authorId,editionId,categoryId,language) VALUES (?,?,?,?,?)";
    const book = [req.body.Title, req.body.Author, req.body.Edition, req.body.Category, req.body.Language];
    db.run(sql, book, (err) => {
        res.redirect("/");
    });
});

app.get("/delete/:id", async (req, res) => {
    const id = req.params.id;
    const sql1 = "SELECT * FROM Books WHERE id = ?";
    const sql2 = "SELECT * FROM Authors";
    const sql3 = "SELECT * FROM Editions";
    const sql4 = "SELECT * FROM Categories";

    async function db_get(query) {
        return new Promise(function (resolve, reject) {
            db.get(query, id, function (err, row) {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }

    let book = await db_get(sql1);

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

    let authors = await db_all(sql2);
    let editions = await db_all(sql3);
    let categories = await db_all(sql4);
    let obj = {book, authors, editions, categories};

    res.render("delete", {
        model: obj,
        title: "Supprime de livre",
        page_name: "deleteBook",
    });

});

app.post("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Books WHERE id = ?";
    db.run(sql, id, (err) => {
        res.redirect("/");
    });
});

app.get("/books", (req, res) => {
    database.readBooks((books) => {
        res.render("books/books", {
            model: books,
            title: "Liste des livres",
            page_name: "books",
        });
    });
});

app.get("/create/book", (req, res) => {
    res.render("books/create", {
        model: {},
        title: "Ajout de livre",
        page_name: "addBook",
    });
});

app.post("/create/book", (req, res) => {
    const sql = "INSERT INTO Books (title) VALUES (?)";
    const book = req.body.Book;
    db.run(sql, book, (err) => {
        // if (err) ...
        res.redirect("/books");
    });
});

app.get("/edit/book/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Books WHERE id = ?";
    db.get(sql, id, (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("books/edit", {
            model: row,
            title: "Modification de livre",
            page_name: "editBook",
        });
    });
});

app.post("/edit/book/:id", (req, res) => {
    const id = req.params.id;
    const book = [req.body.Title, id];
    const sql = "UPDATE Books SET title = ? WHERE (id = ?)";
    db.run(sql, book, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/books");
    });
});

app.get("/delete/book/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Books WHERE id = ?";
    db.get(sql, id, (err, row) => {
        res.render("books/delete", {
            model: row,
            title: "Supprime de livre",
            page_name: "deleteBook",
        });
    });
});

app.post("/delete/book/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Books WHERE id = ?";
    db.run(sql, id, (err) => {
        res.redirect("/books");
    });
});

app.get("/authors", (req, res) => {
    const sql = "SELECT * FROM Authors ORDER BY id";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("authors/authors", {
            model: rows,
            title: "Liste des auteurs",
            page_name: "authors",
        });
    });
});

app.get("/create/author", (req, res) => {
    res.render("authors/create", {
        model: {},
        title: "Ajout de l'auteur",
        page_name: "addAuthor",
    });
});

app.post("/create/author", (req, res) => {
    const sql =
        "INSERT INTO Authors (authorName,birthDate,deathDate) VALUES (?,?,?)";
    const author = [req.body.Author, req.body.Birth, req.body.Death];
    db.run(sql, author, (err) => {
        res.redirect("/authors");
    });
});

app.get("/edit/author/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Authors WHERE id = ?";
    db.get(sql, id, (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("authors/edit", {
            model: row,
            title: "Modification de l'auteur",
            page_name: "editAuthor",
        });
    });
});

app.post("/edit/author/:id", (req, res) => {
    const id = req.params.id;
    const author = [req.body.Author, req.body.Birth, req.body.Death, id];
    const sql =
        "UPDATE Authors SET (authorName,birthDate,deathDate) = (?,?,?) WHERE (id = ?)";
    db.run(sql, author, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/authors");
    });
});

app.get("/delete/author/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Authors WHERE id = ?";
    db.get(sql, id, (err, row) => {
        res.render("authors/delete", {
            model: row,
            title: "Supprime d'auteur",
            page_name: "deleteAuthor",
        });
    });
});

app.post("/delete/author/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Authors WHERE id = ?";
    db.run(sql, id, (err) => {
        res.redirect("/authors");
    });
});

app.get("/categories", (req, res) => {
    const sql = "SELECT * FROM Categories ORDER BY id";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("categories/categories", {
            model: rows,
            title: "Liste des catégories",
            page_name: "categories",
        });
    });
});

app.get("/create/category", (req, res) => {
    res.render("categories/create", {
        model: {},
        title: "Ajout de catégorie",
        page_name: "addCategory",
    });
});

app.post("/create/category", (req, res) => {
    const sql = "INSERT INTO Categories (categoryName) VALUES (?)";
    const category = req.body.Category;
    db.run(sql, category, (err) => {
        res.redirect("/categories");
    });
});

app.get("/edit/category/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Categories WHERE id = ?";
    db.get(sql, id, (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("categories/edit", {
            model: row,
            title: "Modification de catégorie",
            page_name: "editCategory",
        });
    });
});

app.post("/edit/category/:id", (req, res) => {
    const id = req.params.id;
    const category = [req.body.Category, id];
    const sql = "UPDATE Categories SET categoryName = ? WHERE (id = ?)";
    db.run(sql, category, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/categories");
    });
});

app.get("/delete/category/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Categories WHERE id = ?";
    db.get(sql, id, (err, row) => {
        res.render("categories/delete", {
            model: row,
            title: "Supprime de catégorie",
            page_name: "deleteCategory",
        });
    });
});

app.post("/delete/category/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Categories WHERE id = ?";
    db.run(sql, id, (err) => {
        res.redirect("/categories");
    });
});

app.get("/editions", (req, res) => {
    const sql = "SELECT * FROM Editions ORDER BY id";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("editions/editions", {
            model: rows,
            title: "Liste des éditions",
            page_name: "editions",
        });
    });
});

app.get("/create/edition", (req, res) => {
    res.render("editions/create", {
        model: {},
        title: "Ajout de l'édition",
        page_name: "addEdition",
    });
});

app.post("/create/edition", (req, res) => {
    const sql = "INSERT INTO Editions (editionName) VALUES (?)";
    const edition = req.body.Edition;
    db.run(sql, edition, (err) => {
        res.redirect("/editions");
    });
});

app.get("/edit/edition/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Editions WHERE id = ?";
    db.get(sql, id, (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("editions/edit", {
            model: row,
            title: "Modification de l'édition",
            page_name: "editEdition",
        });
    });
});

app.post("/edit/edition/:id", (req, res) => {
    const id = req.params.id;
    const edition = [req.body.Edition, id];
    const sql = "UPDATE Editions SET editionName = ? WHERE (id = ?)";
    db.run(sql, edition, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.redirect("/editions");
    });
});

app.get("/delete/edition/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Editions WHERE id = ?";
    db.get(sql, id, (err, row) => {
        res.render("editions/delete", {
            model: row,
            title: "Supprime d'édition'",
            page_name: "deleteEdition",
        });
    });
});

app.post("/delete/edition/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Editions WHERE id = ?";
    db.run(sql, id, (err) => {
        res.redirect("/editions");
    });
});

app.get("/searching/:search?", async (req, res) => {
    const search = req.query.search;
    const param1 = search + '%';
    const param2 = '%' + search;
    const param3 = '%' + search + '%';
    let sql1 = "SELECT * FROM Books WHERE title LIKE ? OR title LIKE ? OR title LIKE ? OR title LIKE ?";
    let sql2 = "SELECT * FROM Authors WHERE authorName LIKE ? OR authorName LIKE ? OR authorName LIKE ? OR authorName LIKE ?";
    let sql3 = "SELECT * FROM Categories WHERE categoryName LIKE ? OR categoryName LIKE ? OR categoryName LIKE ? OR categoryName LIKE ?";

    async function db_all(query) {
        return new Promise(function (resolve, reject) {
            db.all(query, [search, param1, param2, param3], function (err, rows) {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    let books = await db_all(sql1);
    let authors = await db_all(sql2);
    let categories = await db_all(sql3);
    let obj = {books: books, authors: authors, categories: categories};
    res.render('search', {
        model: obj,
        title: "searching",
        page_name: "searching page"
    });
});

app.get('/filtering', async (req, res) => {
    const search = req.query.Title;
    const author = req.query.Author;
    const category = req.query.Category;
    const edition = req.query.Edition;
    const param1 = search + '%';
    const param2 = '%' + search;
    const param3 = '%' + search + '%';
    const params = [param1, param2, param3, author, category, edition];
    // let sql = "SELECT * FROM Books WHERE title LIKE ? OR title LIKE ? OR title LIKE ? OR title LIKE ? AND authorId = ? AND categoryId = ? AND editionId = ?";
    // let sql = "SELECT Books.id,Books.title, Authors.authorName, Categories.categoryName FROM ((Books JOIN Authors ON Books.authorId = Authors.id) JOIN Categories ON Books.categoryId = Categories.id) WHERE Books.title LIKE ? OR Books.title LIKE ? OR Books.title LIKE ? OR Books.title LIKE ? AND Books.authorId = ? AND Books.categoryId = ? AND Books.editionId = ?";
    // const sql =
    //     "SELECT b.id, b.title, b.language, a.authorName, e.editionName, c.categoryName FROM (Books b JOIN Authors a ON b.authorId = a.id JOIN Editions e ON b.editionId = e.id JOIN Categories c ON b.categoryId = c.id)";
    const sql1 = "SELECT * FROM (SELECT b.id, b.title, b.language, a.authorName, e.editionName, c.categoryName, b.authorId, b.editionId, b.categoryId FROM (Books b JOIN Authors a ON b.authorId = a.id JOIN Editions e ON b.editionId = e.id JOIN Categories c ON b.categoryId = c.id)) WHERE (title LIKE ? OR title LIKE ? OR title LIKE ?) AND (authorId = ? OR categoryId = ? OR editionId = ?)";

    async function db_all(query) {
        return new Promise(function (resolve, reject) {
            db.all(query, params, function (err, rows) {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }

    const books = await db_all(sql1);
    res.render('filterSearch', {model: books, title: 'filtering books', page_name: 'filtering books'});
});
/* istanbul ignore next */
if (!module.parent) {
    app.listen(3000);
    console.log("Express started on port 3000");
}

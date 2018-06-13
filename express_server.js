var express = require("express");
var app = express();
var PORT = 8080;
const cookieParser = require('cookie-parser'); //in order to read cookie sent from client

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("./views/css"));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = { //object keeps track of URLs & shortened form (as values and keys).
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

//function generates a unique shortURL - produces 6 random alphanumeric characters
function generateRandomString() {

  let randomString = "";
  const options = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 6; i++) {

    randomString += options.charAt(Math.random()* options.length);
  }
  return randomString;
}

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase,
      username: req.cookies["username"]
   };
  res.status(200).render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.status(200).render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let {longURL} = req.body;
  urlDatabase[shortURL] = longURL;
  res.redirect(301, "/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let shortUrl = req.params.id;
  const longURL = urlDatabase[req.params.shortURL];
  let templateVars = {
    username: req.cookies["username"]
  }
  if(longURL === undefined) {
    res.status(404).send('Not Found');
  } else {
    res.redirect(301, longURL);
  }
  //return next();
});

app.get("/urls/:id", (req, res) => {
  let {id:shortUrl} = req.params;
  let longUrl = urlDatabase[shortUrl];
  let templateVars = { shortUrl: shortUrl,
    longUrl: longUrl,
    username: req.cookies["username"]
   }
  res.status(200).render("urls_show", templateVars);
})

app.post("/urls/:id/delete", (req, res) => {
  let shortUrl = req.params.id;

  delete urlDatabase[shortUrl];
  res.redirect(301, "/urls");
})

app.post("/urls/:id", (req, res) => {
  let {id:shortUrl} = req.params;
  let {longUrl} = req.body;
  let templateVars = { username: req.cookies["username"] }
  console.log(req.cookies["username"]);
  urlDatabase[shortUrl] = longUrl;
  res.redirect(301, "/urls");
});

//Save cookies & show username//
app.post("/login", (req, res) => {
  let {username} = req.body;
  res.cookie("username", username);
  res.redirect(301, "/urls");
});

//logout
app.post("/logout", (req, res) => {
  let {username} = req.body;
  let templateVars = {
    username: req.cookies["username"]
  }
  res.clearCookie("username", username);
  res.redirect(301, "/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});























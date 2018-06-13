var express = require("express");
var app = express();
var PORT = 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

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
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];

  if(longURL === undefined) {
    res.status(404).send('Not Found');
  } else {
    res.redirect(301, longURL);
  }
  //return next();
});

app.get("/urls/:id", (req, res) => {
  let shortUrl = req.params.id;
  let longUrl = urlDatabase[shortUrl];
  let templateVars = { shortUrl: shortUrl,
    longUrl: longUrl
   }
  res.render("urls_show", templateVars);
})

app.post("/urls/:id/delete", (req, res) => {
  let shortUrl = req.params.id;

  delete urlDatabase[shortUrl];
  res.redirect(301, "/urls");
})
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});























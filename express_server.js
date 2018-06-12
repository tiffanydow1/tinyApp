var express = require("express");
var app = express();
var PORT = 8080;

app.set("view engine", "ejs");

var urlDatabase = { //object keeps track of URLs & shortened form (as values and keys).
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let shortUrl = req.params.id;
  let longUrl = urlDatabase[shortUrl];
  let templateVars = { shortUrl: shortUrl,
    longUrl: longUrl
   }
  res.render("urls_show", templateVars);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
//add new route handler for "urls" & use res.render() to pass URL data to template
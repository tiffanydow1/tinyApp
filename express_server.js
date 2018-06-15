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

const usersDatabase = {
  "userID-1": {
    id: "tiffanyd",
    email: "tiffanyjdow@gmail.com",
    password: "yoloswag"
  },
  "userID-2": {
    id: "camueljackson",
    email: "camueljackson@gmail.com",
    password: "beyoncejay"
  }
}

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
      //userid: req.cookie["userid"]
   };
  res.status(200).render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { userid: req.cookie["userid"] };
  res.status(200).render("urls_new", templateVars);
});

//generates a random alphanumeric string to be set as shortUrl
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
    userid: req.cookie["userid"]
  }
  if(longURL === undefined) {
    res.status(404).send('Not Found');
  } else {
    res.redirect(301, longURL);
  }
  //return next();
});

//Registration page that accepts new users
app.get("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let templateVars = {
    email: email,
    password: password
  };
  res.status(200).render("urls_signup", templateVars);
  });


//Registration Endpoint that handles new users information & inserts inputted info into users database
app.post("/register", (req, res) => {
  let userid = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

   //If user doesn't enter in a value for email or password, send error
    let user = usersDatabase[userid];

    for (let userid in usersDatabase) {
    //console.log("user.email: " + user.email, "req.body.email: " + req.body.email);
    if (usersDatabase.hasOwnProperty(userid)) {
      if (usersDatabase[userid].email === req.body.email) {
        res.status(400).send('User already exists!');
      }
     }
    }

    if ((email === "") || (password === "")) {
    res.status(400).send('Please Enter Email and/or Password');
  } else {
        usersDatabase[userid] = {
        id: userid,
        email: req.body.email,
        password: req.body.password
      }
      res.cookie("userid", usersDatabase[userid]);
      res.redirect(301, "/urls");
     };
  });

//
app.get("/urls/:id", (req, res) => {
  let {id:shortUrl} = req.params;
  let longUrl = urlDatabase[shortUrl];
  let templateVars = { shortUrl: shortUrl,
    longUrl: longUrl,
    userid: req.cookie["userid"]
   }
  res.status(200).render("urls_show", templateVars);
})

//
app.post("/urls/:id/delete", (req, res) => {
  let shortUrl = req.params.id;

  delete urlDatabase[shortUrl];
  res.redirect(301, "/urls");
})

//
app.post("/urls/:id", (req, res) => {
  let {id:shortUrl} = req.params;
  let {longUrl} = req.body;
  let templateVars = { userid: req.cookie["userid"] }
  //console.log(req.cookies["username"]);
  urlDatabase[shortUrl] = longUrl;
  res.redirect(301, "/urls");
});

//LOGIN PAGE
app.get("/login", (req, res) => {

  let templateVars = {
    userid: req.body.userid,
    password: req.body.password
  };
  res.render("urls_login", templateVars);
})

//Save cookies & show username//
app.post("/login", (req, res) => {
  let {userid} = req.body;

  const flattenObject = (obj) => Object.keys(usersDatabase).reduce((acc, curr) => {
    return [...acc, usersDatabase[curr]];
  }, []);

  const findUser = (database,email, password) => {
    return flattenObject(database).find((user) => user.email === email && user.password === password);
  }
  const {email, password} = req.body;
  const maybeUser = findUser(usersDatabase, email, password);

  if (maybeUser !== undefined) {
    req.cookie.userid = maybeUser.id;
    res.redirect(301, "/urls");
  } else {
    res.status(401).send("You are trying to access a page or resource which is unauthorized.");
  }
  });

  // for(let user in usersDatabase) {
  //   let returnUser = usersDatabase[user];
  //   console.log(usersDatabase[user]);
  //   if ((req.body.email === returnUser["email"]) && (req.body.password === returnUser["password"])) {
  //     req.cookie.userid = returnUser["id"];
  //     res.redirect(301, "/urls");
  //     return;
  //   } else {
  //     res.status(401).send("You are trying to access a page or resource which is unathourized.");
  //   }
  // }
  //res.cookie("userid", userid);
  //res.redirect(301, "/urls");


//logout
app.post("/logout", (req, res) => {
  let {userid} = req.body;
  let templateVars = {
    userid: req.cookie["userid"]
  }
  res.clearCookie("userid", userid);
  res.redirect(301, "/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});























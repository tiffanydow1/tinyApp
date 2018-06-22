const express = require('express');
const app = express();
const PORT = 8080;


const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("./views/css"));

//enable encrypted cookies
const cookieSession = require('cookie-session');
app.use(cookieSession( {
  name: 'session',
  keys: ['key1']
}));


 //database for urls = short & long urls
const urlDatabase = { //object keeps track of URLs & shortened form (as values and keys).
  "b2xVn2": {
    longUrl: "http://www.lighthouselabs.ca",
    id: "userID-1"
  },
  "9sm5xK": {
    longUrl: "http://www.google.com",
    id: "userID-2"
  }
};

//database containing user information
const usersDatabase = {
  "userID-1": {
    id: "userID-1",
    email: "tiffanyjdow@gmail.com",
    password: bcrypt.hashSync('tomato', 10)
  },
  "userID-2": {
    id: "userID-2",
    email: "camueljackson@gmail.com",
    password: bcrypt.hashSync('chazal', 10)
  }
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

//function to find if a userID exists in the database for the purpose of creating new shortUrl.
function findUser(email, password) {
  let result = "";

  for (let userid in usersDatabase) {
    if (usersDatabase[userid].email === email) {
      if (bcrypt.compareSync(password, usersDatabase[userid].password)) {
        result = usersDatabase[userid];
        return result;
      }
    }
  return result;
 }
}

//Function that loops for the database of users to verify the user at login via user id
function verifyUser(email) {
  for (user in usersDatabase) {
    if (email === usersDatabase[user].email) {
      return usersDatabase[user];
    }
  }
}

//function that allows logged in users to only view their own short URLs
function urlsForUser(id) {
  let userUrls = {};
  for (let shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].id === id) {
      userUrls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return userUrls;
}

//redirect to /urls page
app.get("/", (req,res) => {
  let cookieID = req.session.userid;
  let templateVars = {
    user: usersDatabase[cookieID]
  }
  if (usersDatabase[cookieID]) {
    res.redirect(301, '/urls');
  } else {
    res.redirect('/urls');
  }
});


app.get("/urls", (req, res) => {
  console.log("went to /urls");
  let cookieID = req.session.userid;
  let templateVars = { urls: urlsForUser(cookieID),
      user: usersDatabase[cookieID]
   };

  if (cookieID) {
    res.status(200).render("urls_index", templateVars);
   } else {
    res.redirect('/login');
   }
});
//calls on function to generate random string to be set as shortUrl and redirects to url_index page
app.post("/urls", (req, res) => {
  let shortUrl = generateRandomString();
  let {longUrl} = req.body;


  const urlObject = {
    longUrl: longUrl,
    id: req.session.userid
  };

  urlDatabase[shortUrl] = urlObject;
  res.redirect(301, "/urls");
});

//show form to input a new url
app.get("/urls/new", (req, res) => {
  let cookieID = req.session.userid;
  let templateVars = {
    user: usersDatabase[cookieID]
     };

     let user = findUser(cookieID);
     if (user) {
      res.status(200).render("urls_new", templateVars);
     } else {
      res.redirect(301, "/login");
     }
});

//Allows user to view their indivuidual url page
app.get("/u/:shortUrl", (req, res) => {
  let longUrl = urlDatabase[req.params.shortUrl];
  let cookieID = req.session.userid;
  let templateVars = {
    user: usersDatabase[cookieID],
    urls: urlsForUser(cookieID)
  };
  if(!urlDatabase[req.params.shortUrl]) {
    res.status(401).render("Error 401", templateVars);
  } else if (urlDatabase[req.params.shortUrl]) {
    res.redirect(longUrl.longUrl);
  }
});

//Registration page that accepts new users
app.get("/register", (req, res) => {
  let email = req.body.email;
  let password = bcrypt.hashSync('req.body.password', 10);
  let cookieID = req.session.userid;
  let templateVars = {
    email: email,
    password: password,
    user: usersDatabase[cookieID]
  };
  res.status(200).render("urls_signup", templateVars);
  });


//Registration Endpoint that handles new users information & inserts inputted info into users database
app.post("/register", (req, res) => {
  const userid = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  console.log(req.body);
  const encodedPassword = bcrypt.hashSync(password, 10);
   //If user doesn't enter in a value for email or password, send error
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
        email: email,
        password: encodedPassword
      };
      req.session.userid = userid;
      res.redirect(301, "/urls");
     }
     console.log(usersDatabase);
  });

//Request to update a long url and rediect back to URL page.
app.get("/urls/:id", (req, res) => {

  let cookieID = req.session.userid;
  if (urlDatabase[req.params.id]) {
    let templateVars = {
      shortUrl: req.params.id,
      longUrl: urlDatabase[req.params.id].longUrl,
      user: usersDatabase[cookieID],
      urls: urlsForUser(cookieID)
    };
    res.render("urls_show", templateVars);
  }

});

//Gives user permission to delete existing URL's only if they are signed in.
app.post("/urls/:id/delete", (req, res) => {
  let cookieID = req.session.userid; //setting user id key on a session
  let shortUrl = req.params.id;
  if (urlDatabase[shortUrl].id === cookieID) {
    delete urlDatabase[shortUrl];
    res.redirect(301, "/urls");
  } else {
    res.status(400).send('You do not have permission to delete this URL');
    return;
  }
});

//
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longUrl = req.body.longUrl;
  if (urlDatabase[req.params.id].longUrl !== /^https?:\/\//) {
    urlDatabase[req.params.id].longUrl = `https://${urlDatabase[req.params.id].longUrl}`;
  }
  res.redirect("/urls");
});

//LOGIN PAGE
app.get("/login", (req, res) => {

const currentUser = req.session.userid;

  const templateVars = {
    user: currentUser
  }
  if (currentUser) {
    res.redirect('/urls', templateVars);
  } else {
    res.render('urls_login', templateVars);
  }
});

//Login page - check to see if a user account already exists, if so, login. If no account, redirect to error page.
  app.post("/login", (req, res) => {

  let email = req.body.email;
  let password = req.body.password;
  let verifiedUser = verifyUser(email);

  if (verifiedUser) {
    console.log('email: ' + email);
    console.log('verifiedUser.email: ' + verifiedUser.email);
     if ((verifiedUser.email === email) && (bcrypt.compareSync(password, verifiedUser.password))) {
      res.cookie("verifiedUser", verifiedUser);
      req.session.userid = verifiedUser.id
      res.redirect('/urls');
     } else {
      res.status(401).send('You are trying to access a page or resource which is unauthorized.');
     }
  }
  });

  //  const flattenObject = (obj) => Object.keys(usersDatabase).reduce((acc, curr) => {
  //   return [...acc, usersDatabase[curr]];
  // }, []);

  // const findUser = (database, email, password) => {

  //   return flattenObject(database).find((user) =>
  //     ((user.email === userEmail) && (bcrypt.compareSync(userPassword, user.password))));
  // }
  // const maybeUser = findUser(usersDatabase, userEmail, userPassword);

  // if (maybeUser) {
  //   req.session.userid = maybeUser['id'];

  //   res.redirect(301, "/urls");
  // } else {
  //   res.status(401).send("You are trying to access a page or resource which is unauthorized.");
  //   return;




//logout - after logout button is clicked, cookies are cleared and page redirects to login
app.post("/logout", (req, res) => {
  req.session.userid = null;
  res.redirect(301, "/login");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});






















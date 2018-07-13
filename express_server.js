const express = require('express');
const app = express();
const PORT = 8080;
const flash = require('express-flash');

app.set('view engine', 'ejs');

//Handles information being submitted through the body of forms
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

//Handles users sessions through the use of cookies
const cookieSession = require('cookie-session');

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}));

app.use(express.static("./views"));
app.use(flash());


//Allows for the encryption of sensitive user information
const bcrypt = require('bcryptjs');


// ******************************************************* //

 //Database containing URLS - object keeps track of long URLS & their shortened form (as keys & values)
const urlDatabase = {
  'b2xVn2': {
    id: 'userid-1',
    longUrl: 'http://www.lighthouselabs.ca'
  },

  '9sm5xK': {
    id: 'userid-2',
    longUrl: 'http://www.google.com'
  }
};

//Database containing information about users on application
const usersDatabase = {
  'userid-1': {
    id: 'userid-1',
    email: 'tiffanyjdow@gmail.com',
    password: bcrypt.hashSync('tomato', 10)
  },
  'userid-2': {
    id: 'userid-2',
    email: 'camueljackson@gmail.com',
    password: bcrypt.hashSync('chazal', 10)
  }
};

// ****************************************************** //

//FUNCTIONS

//Generates a unique shorturl by producing 6 random alphanumeric characters
const generateRandomString = () => {

  let randomString = '';
  const options = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {

    randomString += options.charAt(Math.random()* options.length);
  }
  return randomString;
};

function findUser(id) {
  let foundUser;
  for (let userid in usersDatabase) {
    if (usersDatabase[userid].id === id) {
      foundUser = usersDatabase[userid];
    }
  }
  return foundUser;
}

const verifyUser = (email, password) => {

  for (let users in usersDatabase) {
    if (usersDatabase[users].email === email) {
      if (bcrypt.compareSync(password, usersDatabase[users].password)) {
        return (usersDatabase[users].id);
      }
    }
  }
  return false;
};

//function that allows logged in users to view only their own short URLs
const urlsForUser = (id) => {
  let userUrls = {};
  for (let shortUrl in urlDatabase) {
    if (urlDatabase[shortUrl].id === id) {
      userUrls[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return userUrls;
}

// ********************************************************* //

//Index page
app.get('/', (req,res) => {

let verifiedUser = req.session.userid;

if (verifiedUser) {
  res.status(301).redirect('/urls');
} else {
  res.status(301).redirect('/login');
 }
});

//Registration page that accepts new users
app.get('/register', (req, res) => {

   res.status(200).render('urls_login');
});

//Login page that allows users to sign into their account
app.get('/login', (req, res) => {

    res.status(200).render('urls_login');
});

//Main URL page where users can see their long & short urls
app.get('/urls', (req, res) => {

  let cookieID = req.session.userid;
  let templateVars = {
    urls: urlsForUser(cookieID),
    user: usersDatabase[cookieID]
  };

  if (usersDatabase[cookieID]) {
    res.status(200).render('urls_index', templateVars);
  } else {
     req.flash('error', 'You are trying to access a page that requires user authentication, please try again.');
     res.status(301).redirect('/login');
  }
});

//Takes users to a page where they can generate a new shorturl
app.get('/urls/new', (req, res) => {

    let cookieID = req.session.userid;

    let templateVars = {
      user: usersDatabase[cookieID]
    };

    let user = findUser(cookieID);
      if (user) {
        res.status(200).render('urls_new', templateVars);
      } else {
        res.redirect(301, '/login');
      }
  });

//Uses the user-generated shorturl to redirect to the longurl
app.get('/u/:shortUrl', (req, res) => {

     let shortUrl = req.params.id;
     let longUrl = urlDatabase[req.params.shortUrl].longUrl;
     let redirect;

      if (!longUrl.includes('http')) {
        redirect = 'http://' + longUrl;
      } else {
        redirect = longUrl;
      }
        res.status(301).redirect(redirect);

});

//Users custom URL page
app.get("/urls/:id", (req, res) => {

    let cookieID = req.session.userid;

      if(urlDatabase[req.params.id]) {

    let templateVars = {
      shortUrl: req.params.id,
      longUrl: urlDatabase[req.params.id].longUrl,
      user: usersDatabase[cookieID],
      urls: urlsForUser(cookieID)
    };
      res.status(200).render('urls_show', templateVars);
    }
});

// *********************************************************** //

// POST //

//Registration Endpoint that handles new users information & inserts info into users database
app.post('/register', (req, res) => {

  let userid = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;

  for (let user in usersDatabase) {

    if (email === "" || password === "") {
      req.flash('error', 'Please fill in your email and/or password to continue')
      res.status(301).redirect('/login');
    } if (email === usersDatabase[user].email) {
      req.flash('error', 'User already exists, please try registering again');
      res.status(301).redirect('/login');
    } else {
      usersDatabase[userid] = {
        id: userid,
        email: email,
        password: bcrypt.hashSync(password, 10)
      };

      req.session.userid = userid;
      res.redirect('urls');
    }
  }

 });


//Login page - check to see if a user account already exists, if so, login. If no account, redirect to error page.
app.post('/login', (req, res) => {

    let email = req.body.email;
    let password = req.body.password;
    let verifiedUser = verifyUser(email, password);

      if (verifiedUser) {

        req.session.userid = verifiedUser;
        res.status(301).redirect('/urls');
      } else {
        req.flash('error', 'Username and Password do not match. Please try again.')
        res.status(301).redirect('/login')
      }
  });

//logout - after logout button is clicked, cookies are cleared and page redirects to index page
app.post('/logout', (req, res) => {

  req.session.userid = null;
  res.status(301).redirect('/login');
});

//Allows users to create urls
app.post('/urls', (req, res) => {

  let shortUrl = generateRandomString();
  let longUrl = req.body.longUrl;

  const urlObject = {
    longUrl: longUrl,
    id: req.session.userid
  };

    urlDatabase[shortUrl] = urlObject;
    res.redirect(301, '/urls');

  });

//Functionality that allows users to view their shorturl information
app.post('/urls/:id', (req, res) => {

  let shortUrl = req.params.id;
  let longUrl = req.body.longUrl;

    urlDatabase[shortUrl] = {
      longUrl: longUrl,
      id: req.session.userid
    }

      res.status(301).redirect('/urls')

});


//Functionality that allows users to delete an existing URL only if they are signed in.
app.post('/urls/:id/delete', (req, res) => {

    let cookieID = req.session.userid;
    let shortUrl = req.params.id;

    if (urlDatabase[shortUrl].id === cookieID) {
      delete urlDatabase[shortUrl];
      res.status(301).redirect('/urls');
    } else {
      res.status(400).send('Error: You do not have permission to delete this URL');
      return;
    }
  });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});






















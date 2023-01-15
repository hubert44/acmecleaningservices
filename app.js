const path = require('path');

const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const csrf = require('csurf');
const session = require('express-session');
const SessionStore = require('connect-mongodb-session')(session);
const helmet = require('helmet');
const conpression = require('compression');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolver');

const pagesRoute = require('./routes/links');
const compression = require('compression');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const store = new SessionStore({
    uri: `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.tozv2.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
    collection: "session" 
})

app.use(bodyParser.json());
// app.use(helmet());
app.use(compression());
app.use(session({
    secret: "acmeCleaningServicesSecretThatOnlyGyganeKnows",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: 3600000
    },
    store: store
}));
app.use(csrf());
// app.disable('x-powered-by');
// app.enable("trust proxy");
// app.use((req, res, next) => {
//     if (req.secure) {
//         next();
//     } else {
//         res.redirect('https://' + req.headers.host + req.url);
//     }
// });
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(pagesRoute);

app.use('/graphql', graphqlHTTP({
    rootValue: graphqlResolver,
    schema: graphqlSchema,
    graphiql: true,
    customFormatErrorFn(err){
        if(!err.originalError){
            err.icon = "error";
            err.title = "Error";
            return err;
        }
        return {message: err.originalError.message, status: err.originalError.statusCode || 500, 
            icon: err.originalError.icon || "error", title: err.originalError.title || "Oops...",
            inputField: err.originalError.inputField || false, nLog: err.originalError.nLog || false
        };
    }
}));

app.use((req, res, next) => {
    res.status(404).render('errorpage', {
        title: 'ACME - Page not found',
        style: "styles/errorpage.css",
        loggedIn: req.session.loggedInUser
    });
});

app.use((error, req, res, next) => {
    res.status(error.statusCode || 500).render('errorpage', {
        title: 'ACME - Page not found',
        style: "styles/errorpage.css",
        loggedIn: req.session.loggedInUser
    });
});

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.tozv2.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
.then(() => {
    console.log('conneted');
    app.listen(process.env.PORT || 3000);
})
.catch(err => {
    console.log(err);
});

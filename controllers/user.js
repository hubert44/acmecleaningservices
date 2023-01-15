const User = require('../models/customer');
const Booking = require('../models/booking');

const getHome = (req, res, next) => {
    res.status(200).render('users/home', {
        title: 'ACME - Home',
        style: false,
        loggedIn: req.session.loggedInUser
    });
};

const getServices = (req, res, next) => {
    res.status(200).render('users/services', {
        title: 'ACME - Services',
        style: false,
        loggedIn: req.session.loggedInUser
    });
};

const getBook = (req, res, next) => {
    res.status(200).render('users/book', {
        title: 'ACME - Booking',
        style: "styles/book.css",
        loggedIn: req.session.loggedInUser
    });
};

const getSignin = (req, res, next) => {
    res.status(200).render('users/signin', {
        title: 'ACME - Signin',
        style: "styles/account.css",
        loggedIn: req.session.loggedInUser
    });
};

const getSignout = (req, res, next) => {
    req.session.destroy(err => {
        res.status(302).redirect('/login')
    });
};

const getSignup = (req, res, next) => {
    res.status(200).render('users/signup', {
        title: 'ACME - Signup',
        style: "styles/account.css",
        loggedIn: req.session.loggedInUser
    });
};

const getResetPassword = (req, res, next) => {
    res.status(200).render('users/resetpassword', {
        title: 'ACME - Password Reset',
        style: "styles/account.css",
        loggedIn: req.session.loggedInUser
    });
};

const getContact = (req, res, next) => {
    res.status(200).render('users/contact', {
        title: 'ACME - Contact',
        style: "styles/contact.css",
        loggedIn: req.session.loggedInUser
    });
};

const getAccount = (req, res, next) => {
    let name;
    let email;
    User.findOne({_id: req.session.loggedInUser})
    .then(user => {
        if(!user){
            const err = new Error("No user found");
            err.statusCode = 422;
            throw err;
        }
        name = user.name;
        email = user.email;
        return Booking.find({owner: req.session.loggedInUser}).sort({_id: -1});
    })
    .then(bookings => {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return res.status(200).render('users/account', {
            title: 'ACME - Account',
            style: "styles/cusaccount.css",
            bookings: bookings,
            name: name,
            email: email,
            months: months,
            loggedIn: req.session.loggedInUser
        });
    })
    .catch(err => {
        next(err);
    });
};

const getSigninVerify = (req, res, next) => {
    const token = req.params.token;
    User.findOne({verificationCode: token, verificationExp: {$gt: Date.now()}})
    .then(user => {
        if(!user){
            const err = new Error('Invalid validation token');
            err.statusCode = 403;
            throw err;
        }
    
        user.verificationCode = null;
        user.status = "verified";
        return user.save();
    })
    .then(user => {
        return res.status(302).redirect('/login');
    })
    .catch(err => {
        next(err);
    });
};

const getNewPassword = (req, res, next) => {
    const token = req.params.token;

    User.findOne({resetPasswordToken: token, resetPasswordExp: {$gt: Date.now()}})
    .then(user => {
        if(!user){
            const err = new Error("Invalid reset token");
            err.statusCode = 403;
            throw err;
        }

        return res.status(200).render('users/newpassword', {
            title: 'ACME - Password Reset',
            style: "styles/account.css",
            userId: user._id,
            loggedIn: req.session.loggedInUser
        });
    })
    .catch(err => {
        next(err);
    })
};

module.exports = {getHome: getHome, getServices: getServices, getBook: getBook, getSignin: getSignin, 
    getSignup: getSignup, getResetPassword: getResetPassword, getContact : getContact, getSigninVerify: getSigninVerify, 
    getNewPassword: getNewPassword, getAccount: getAccount, getSignout: getSignout};
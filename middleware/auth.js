const accountAuth = (req, res, next) => {
    if(!req.session.loggedInUser){
        return res.status(302).redirect("/login");
    }
    next();
};

const loginAuth = (req, res, next) => {
    if(req.session.loggedInUser){
        return res.status(302).redirect("/account");
    }
    next();
};

const logoutAuth = (req, res, next) => {
    if(!req.session.loggedInUser){
        return res.status(302).redirect("/login");
    }
    next();
};

module.exports = {accountAuth: accountAuth, loginAuth: loginAuth, logoutAuth: logoutAuth};
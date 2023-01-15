const crypto = require('crypto');

const validator = require('validator');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sendgrid = require('nodemailer-sendgrid');

const User = require('../models/customer');
const Contact = require('../models/contact');
const Booking = require('../models/booking');


const transport = nodemailer.createTransport(sendgrid({
    apiKey: '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'
}));

module.exports = {
    name(){
        return 'Person Name';
    },

    signup({userInput}, req){
    
        let username = validator.whitelist(userInput.username, "a-z A-Z");
        username = validator.trim(username);
        username = username.replace(/ +(?= )/g,'');
        username = validator.escape(username);

        let email = validator.trim(userInput.email);
        email = validator.whitelist(email, "a-zA-Z0-9.\\-@_");
        email = validator.escape(email);
        email = validator.normalizeEmail(email);

        let password = validator.trim(userInput.password);
        password = validator.whitelist(password, "a-zA-Z0-9\\-_");
        password = validator.escape(password);

        if(!validator.isLength(username, {min: 5})){
            const err = new Error('Name must be at least five letters');
            err.statusCode = 422;
            err.inputField = "username";
            throw err;
        }
        if(!validator.isEmail(email)){
            const err = new Error('Invalid email');
            err.statusCode = 422;
            err.inputField = "email";
            throw err;
        }
        if(!validator.isLength(password, {min: 5})){
            const err = new Error('Password must be at least five characters');
            err.statusCode = 422;
            err.inputField = "password";
            throw err;
        }
        
        let veryCode;
        let newCustomer;

        crypto.randomBytes(32, (err, buffer) => {
            if(err){
                const errr = new Error('Failed to request verification link');
                throw errr;
            }
            veryCode = buffer.toString('hex');
        });

        return User.findOne({email: email})
        .then(user => {
            if(user){
                const err = new Error('User with this email already exists');
                err.statusCode = 403;
                err.icon = "warning";
                err.inputField = "email";
                throw err;
            }
            return bcrypt.hash(password, 12);
        })
        .then(hashPass => {
            newCustomer = new User({
                name: username,
                email: email,
                verificationCode: veryCode,
                verificationExp: Date.now() + 3600000,
                password: hashPass
            });
            return transport.sendMail({
                to: email,
                from: 'info@acmecleaningservices.org',
                subject: 'Verification of Account',
                html: `
                        <h3>Hi ${username.split(" ")[0]},</h3>
                        <p style="color: grey;">Please ignore you did not create an account or request for a verification link</p>
                        <p style="margin: 1rem 0;">Click on the button below to verify your account</p>
                        <p style="margin: 2rem 0;"><a href="https://www.acmecleaningservices.org/login/${veryCode}" target="_blank" style="box-sizing: border-box;
                        border-color: #348eda; font-weight: 400; text-decoration: none; display: inline-block; margin: 0; color: #ffffff; background-color: #348eda; border: solid 1px #348eda; border-radius: 2px; 
                        cursor: pointer; font-size: 14px; padding: 12px 45px;">Verify Account</a></p>
                        <p style="margin: 1rem 0;">ACME</p>
                `
            });
        })
        .then(mail => {
            return newCustomer.save();
        })
        .then(customer => {
            return {
                title: "Account created",
                message: "A verification link has been sent to your email which expires after an hour",
                icon: "success"
            };
        })
        .catch(err => {
            throw err;
        });
        
    },

    login({userInput}, req){
        let email = validator.trim(userInput.email);
        email = validator.whitelist(email, "a-zA-Z0-9.\\-@_");
        email = validator.escape(email);
        email = validator.normalizeEmail(email);

        let password = validator.trim(userInput.password);
        password = validator.whitelist(password, "a-zA-Z0-9\\-_");
        password = validator.escape(password);

        if(!validator.isEmail(email)){
            const err = new Error("Invalid email");
            err.statusCode = 422;
            err.inputField = "email";
            throw err;
        }

        if(!validator.isLength(password, {min: 1})){
            const err = new Error("Invalid password");
            err.statusCode = 422;
            err.inputField = "password";
            throw err;
        }

        let loggedUser;
        let veryCode;
        let codeDir;

        crypto.randomBytes(32, (err, buffer) => {
            if(err){
                const errr = new Error('Failed to request verification link');
                throw errr;
            }
            veryCode = buffer.toString('hex');
        });

        return User.findOne({email: email})
        .then(user => {
            if(!user){
                const err = new Error("Invalid email or password");
                err.statusCode = 403;
                throw err;
            }

            loggedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isValid => {
            if(!isValid){
                if(loggedUser.loginCounter > 2 && loggedUser.loginCounterExp >= Date.now()){
                    const err = new Error("Login trials exceeded, try again after an hour");
                    err.statusCode = 403;
                    err.icon = "warning";
                    throw err;
                }
                if(loggedUser.loginCounter > 2 && loggedUser.loginCounterExp < Date.now()){
                    loggedUser.loginCounter = 1;
                }else{
                    loggedUser.loginCounter += 1;
                }
                loggedUser.loginCounterExp = Date.now() + 3600000;
                codeDir = "loginFailed";
                return loggedUser.save();
            }

            if(loggedUser.loginCounter > 2 && loggedUser.loginCounterExp >= Date.now()){
                const err = new Error("Login trials exceeded, try again after an hour");
                err.statusCode = 403;
                err.icon = "warning";
                throw err;
            }

            if(loggedUser.status !== "verified"){
                if(loggedUser.verificationExp >= Date.now()){
                    const err = new Error("Verification link has been sent to your email already or retry after an hour");
                    err.title = "Verification required";
                    err.statusCode = 403;
                    err.icon = "warning";
                    throw err;
                }
                return transport.sendMail({
                    to: email,
                    from: 'info@acmecleaningservices.org',
                    subject: 'Verification of Account',
                    html: `
                            <h3>Hi ${loggedUser.name.split(" ")[0]},</h3>
                            <p style="color: grey;">Please ignore you are not requested to verify your account</p>
                            <p style="margin: 1rem 0;">Click on the button below to verify your account</p>
                            <p style="margin: 2rem 0;"><a href="https://www.acmecleaningservices.org/login/${veryCode}" target="_blank" style="box-sizing: border-box;
                            border-color: #348eda; font-weight: 400; text-decoration: none; display: inline-block; margin: 0; color: #ffffff; background-color: #348eda; border: solid 1px #348eda; border-radius: 2px; 
                            cursor: pointer; font-size: 14px; padding: 12px 45px;">Verify Account</a></p>
                            <p style="margin: 1rem 0;">ACME</p>
                    `
                });
            }
            
            return "verified";
        })
        .then(result => {
            if(codeDir === "loginFailed"){
                const err = new Error("Invalid email or password");
                err.statusCode = 403;
                throw err;
            }

            if(result === "verified"){
                codeDir = "verified";
                loggedUser.loginCounter = 0;
                return loggedUser.save();
            }

            loggedUser.verificationCode = veryCode;
            loggedUser.loginCounter = 0;
            loggedUser.verificationExp = Date.now() + 3600000;

            return loggedUser.save();
        })
        .then(result => {
            if(codeDir === "verified"){
                req.session.loggedInUser = loggedUser._id;
                return "User Logged in";
            }
            const err = new Error("A verification link has been sent to your email which expires after an hour");
            err.status = 401;
            err.title = "Account not verified";
            err.icon = "info";
            throw err;
        })
        .catch(err => {
            throw err;
        });
    },

    resetPassword({userInput}, req){
        let email = validator.trim(userInput.email);
        email = validator.whitelist(email, "a-zA-Z0-9.\\-@_");
        email = validator.escape(email);
        email = validator.normalizeEmail(email);

        if(!validator.isEmail(email)){
            const err = new Error('Invalid email');
            err.statusCode = 422;
            err.inputField = "email";
            throw err;
        }

        let token;
        let resetUser;

        crypto.randomBytes(32, (err, buffer) => {
            if(err){
                const errr = new Error("Failed to generate reset token");
                throw errr;
            }
            token = buffer.toString('hex');
        });

        return User.findOne({email: email})
        .then(user => {
            if(!user){
                const err = new Error("Email does not exist");
                err.statusCode = 422;
                err.inputField = "email";
                throw err;
            }

            resetUser = user;

            if(user.resetPasswordExp >= Date.now()){
                const err = new Error("Reset link has been sent to your email already or retry after an hour");
                err.statusCode = 403;
                err.icon = "warning";
                throw err;
            }

            return transport.sendMail({
                to: email,
                from: "info@acmecleaningservices.org",
                subject: "Password Reset",
                html: `
                        <h3>Hi ${user.name.split(" ")[0]},</h3>
                        <p style="color: grey;">Please ignore if you did not request for password reset</p>
                        <p style="margin: 1rem 0;">Click on the button below to reset your password</p>
                        <p style="margin: 2rem 0;"><a href="https://www.acmecleaningservices.org/resetpassword/${token}" target="_blank" style="box-sizing: border-box;
                        border-color: #348eda; font-weight: 400; text-decoration: none; display: inline-block; margin: 0; color: #ffffff; background-color: #348eda; border: solid 1px #348eda; border-radius: 2px; 
                        cursor: pointer; font-size: 14px; padding: 12px 45px;">Reset Password</a></p>
                        <p style="margin: 1rem 0;">ACME</p>
                `
            });
        })
        .then(email => {
            resetUser.resetPasswordToken = token;
            resetUser.resetPasswordExp = Date.now() + 3600000;

            return resetUser.save();
        })
        .then(user => {
            return {
                title: "Reset password",
                message: "A reset link has been sent to your email which expires after an hour",
                icon: "info"
            };
        })
        .catch(err => {
            throw err;
        });
    },

    newPassword({userInput}, req){
        let password = validator.trim(userInput.password);
        password = validator.whitelist(password, "a-zA-Z0-9\\-_");
        password = validator.escape(password);

        let coPassword = validator.trim(userInput.coPassword);
        coPassword = validator.whitelist(coPassword, "a-zA-Z0-9\\-_");
        coPassword = validator.escape(coPassword);

        let userId = validator.trim(userInput.userId);
        userId = validator.whitelist(userId, "0-9a-f");
        userId = validator.escape(userId);

        if(!validator.isLength(password, {min: 5})){
            const err = new Error("Password must be at least 5 characters");
            err.statusCode = 422;
            err.inputField = "password";
            throw err;
        }

        if(validator.isEmpty(coPassword)){
            const err = new Error("Invalid password");
            err.statusCode = 422;
            err.inputField = "coPassword";
            throw err;
        }

        if(coPassword !== password){
            const err = new Error("Password mismatch");
            err.statusCode = 422;
            err.inputField = "coPassword";
            throw err;
        }

        if(userId.length !== 24){
            const err = new Error("Bad request");
            err.statusCode = 400;
            throw err;
        }

        let resetUser;

        return User.findOne({_id: userId})
        .then(user => {
            if(!user){
                const err = new Error("Invalid request");
                err.statusCode = 403;
                throw err;
            }
            resetUser = user;
            return bcrypt.hash(password, 12);
        })
        .then(hashPass => {
            resetUser.password = hashPass;
            resetUser.resetPasswordToken = null;
            resetUser.loginCounter = 0;
            return resetUser.save();
        })
        .then(user => {
            return "Password has been changed successfully";
        })
        .catch(err => {
            throw err;
        });
    },

    contact({userInput}, req){
        let name = validator.whitelist(userInput.name, "a-z A-Z");
        name = validator.trim(name);
        name = name.replace(/ +(?= )/g,'');
        name = validator.escape(name);

        let number = validator.trim(userInput.number);
        number = validator.whitelist(number, "0-9+");
        number = validator.escape(number);

        let email = validator.trim(userInput.email);
        email = validator.whitelist(email, "a-zA-Z0-9.\\-@_");
        email = validator.escape(email);
        email = validator.normalizeEmail(email);

        let subject = validator.whitelist(userInput.subject, "a-zA-Z0-9.\\- _");
        subject = validator.trim(subject);
        subject = subject.replace(/ +(?= )/g,'');
        subject = validator.escape(subject);

        let message = validator.whitelist(userInput.message, "a-zA-Z0-9.\\- _");
        message = validator.trim(message);
        message = message.replace(/ +(?= )/g,'');
        message = validator.escape(message);

        if(!validator.isLength(name, {min: 5})){
            const err = new Error("Name must be atleast 5 characters.");
            err.statusCode = 422;
            err.inputField = "username";
            throw err;
        }

        if(!validator.isLength(number, {min: 11, max: 14})){
            const err = new Error("Invalid phone number.");
            err.statusCode = 422;
            err.inputField = "phonenumber";
            throw err;
        }

        if(!validator.isEmail(email)){
            const err = new Error("Invalid email.");
            err.statusCode = 422;
            err.inputField = "email";
            throw err;
        }

        if(!validator.isLength(subject, {min: 5})){
            const err = new Error("Subject must contain atleast 5 characters.");
            err.statusCode = 422;
            err.inputField = "subject";
            throw err;
        }

        if(!validator.isLength(message, {min: 5})){
            const err = new Error("Message must contain atleast 5 characters.");
            err.statusCode = 422;
            err.inputField = "message";
            throw err;
        }

        const newContact = new Contact({
            name: name,
            number: number,
            email: email,
            subject: subject,
            message: message
        });

        return newContact.save()
        .then(contact => {
            return {
                title: "Submitted",
                message: "We have received your message.",
                icon: "success"
            };
        })
        .catch(err => {
            throw err;
        });

    },

    book({userInput}, req){
        let cleaningService = validator.whitelist(userInput.cleaningService, "a-z A-Z\\-");
        cleaningService = validator.trim(cleaningService);
        cleaningService = cleaningService.replace(/ +(?= )/g,'');
        cleaningService = validator.escape(cleaningService);

        let cleaningType = validator.whitelist(userInput.cleaningType, "a-z A-Z");
        cleaningType = validator.trim(cleaningType);
        cleaningType = cleaningType.replace(/ +(?= )/g,'');
        cleaningType = validator.escape(cleaningType);

        let apartmentType = validator.whitelist(userInput.apartmentType, "a-z A-Z\\-");
        apartmentType = validator.trim(apartmentType);
        apartmentType = apartmentType.replace(/ +(?= )/g,'');
        apartmentType = validator.escape(apartmentType);

        let cleaningDate = validator.whitelist(userInput.cleaningDate, "a-z A-Z,\\-0-9");
        cleaningDate = validator.trim(cleaningDate);
        cleaningDate = cleaningDate.replace(/ +(?= )/g,'');
        cleaningDate = validator.escape(cleaningDate);

        let number = validator.trim(userInput.number);
        number = validator.whitelist(number, "0-9+");
        number = validator.escape(number);

        let serviceFrequency = validator.whitelist(userInput.serviceFrequency, "a-z A-Z");
        serviceFrequency = validator.trim(serviceFrequency);
        serviceFrequency = serviceFrequency.replace(/ +(?= )/g,'');
        serviceFrequency = validator.escape(serviceFrequency);

        let serviceState = validator.whitelist(userInput.serviceState, "a-zA-Z");
        serviceState = validator.trim(serviceState);
        serviceState = serviceState.replace(/ +(?= )/g,'');
        serviceState = validator.escape(serviceState);

        let serviceLocation = validator.whitelist(userInput.serviceLocation, "a-z A-Z,\\-0-9");
        serviceLocation = validator.trim(serviceLocation);
        serviceLocation = serviceLocation.replace(/ +(?= )/g,'');
        serviceLocation = validator.escape(serviceLocation);

        let notes = validator.whitelist(userInput.notes, "a-z A-Z,\\-0-9");
        notes = validator.trim(notes);
        notes = notes.replace(/ +(?= )/g,'');
        notes = validator.escape(notes);


        if(!req.session.loggedInUser){
            const err = new Error("Login to complete booking");
            err.statusCode = 401;
            err.title = "Login required"
            err.icon = "info"
            err.nLog = "/login";
            throw err;
        }

        if(validator.isEmpty(cleaningService)){
            const err = new Error("Invalid cleaning service");
            err.statusCode = 422;
            err.inputField = "cleaningService";
            throw err;
        }
        if(validator.isEmpty(cleaningType)){
            const err = new Error("Invalid cleaning type");
            err.statusCode = 422;
            err.inputField = "cleaningType";
            throw err;
        }
        if(validator.isEmpty(apartmentType)){
            const err = new Error("Invalid apartment type");
            err.statusCode = 422;
            err.inputField = "apartmentType";
            throw err;
        }
        if(validator.isEmpty(cleaningDate)){
            const err = new Error("Invalid cleaning date");
            err.statusCode = 422;
            err.inputField = "cleaningDate";
            throw err;
        }
        if(!validator.isLength(number, {min: 11, max: 14})){
            const err = new Error("Invalid phone number.");
            err.statusCode = 422;
            err.inputField = "number";
            throw err;
        }
        if(validator.isEmpty(serviceFrequency)){
            const err = new Error("Invalid cleaning frequency");
            err.statusCode = 422;
            err.inputField = "serviceFrequency";
            throw err;
        }
        if(validator.isEmpty(serviceState)){
            const err = new Error("Invalid state");
            err.statusCode = 422;
            err.inputField = "serviceState";
            throw err;
        }
        if(validator.isEmpty(serviceLocation)){
            const err = new Error("Invalid location");
            err.statusCode = 422;
            err.inputField = "serviceLocation";
            throw err;
        }

        const newBooking = new Booking({
            owner: req.session.loggedInUser,
            cleaningService: cleaningService,
            cleaningType: cleaningType,
            apartmentType: apartmentType,
            cleaningDate: cleaningDate,
            number: number,
            serviceFrequency: serviceFrequency,
            serviceState: serviceState,
            serviceLocation: serviceLocation,
            notes: notes
        });

        return newBooking.save()
        .then(booking => {
            return {
                title: "Session placed",
                message: "Booking placed suucessfully",
                icon: "success"
            };
        })
        .catch(err => {
            throw err;
        });
    },

    updateInfo({userInput}, req){
        let username = validator.whitelist(userInput.username, "a-z A-Z");
        username = validator.trim(username);
        username = username.replace(/ +(?= )/g,'');
        username = validator.escape(username);

        let email = validator.trim(userInput.email);
        email = validator.whitelist(email, "a-zA-Z0-9.\\-@_");
        email = validator.escape(email);
        email = validator.normalizeEmail(email);

        if(!validator.isLength(username, {min: 5})){
            const err = new Error('Name must be at least five letters');
            err.statusCode = 422;
            err.inputField = "username";
            throw err;
        }
        if(!validator.isEmail(email)){
            const err = new Error('Invalid email');
            err.statusCode = 422;
            err.inputField = "email";
            throw err;
        }

        const loggedInUser = req.session.loggedInUser;

        return User.findOne({email: email, _id: { $ne: loggedInUser }})
        .then(user => {
            if(user){
                const err = new Error("An account with this email exists already");
                err.statusCode = 400;
                err.inputField = "email";
                throw err;
            }
            return User.findOne({_id: loggedInUser});
        })
        .then(user => {
            if(!user){
                const err = new Error("Invalid request");
                err.statusCode = 400;
                throw err;
            }
            if(username === user.name && email ===user.email){
                const err = new Error("No change found!");
                err.statusCode = 422;
                err.icon = "info";
                throw err
            }
            user.name = username;
            user.email = email;
            return user.save();
        })
        .then(user => {
            return {
                title: "Account updated",
                message: "Your info has been updated successfully",
                icon: "success"
            };
        })
        .catch(err => {
            throw err;
        });
    },

    updatePassword({userInput}, req){
        let password = validator.trim(userInput.currentPass);
        password = validator.whitelist(password, "a-zA-Z0-9\\-_");
        password = validator.escape(password);

        let newPassword = validator.trim(userInput.newPass);
        newPassword = validator.whitelist(newPassword, "a-zA-Z0-9\\-_");
        newPassword = validator.escape(newPassword);

        if(validator.isEmpty(password)){
            const err = new Error("Invalid password");
            err.statusCode = 422;
            err.inputField = "cuPassword";
            throw err;
        }

        if(!validator.isLength(newPassword, {min: 5})){
            const err = new Error('Password must be at least five characters');
            err.statusCode = 422;
            err.inputField = "newPassword";
            throw err;
        }

        const loggedInUser = req.session.loggedInUser;
        let loggedUser;

        return User.findOne({_id: loggedInUser})
        .then(user => {
            if(!user){
                const err = new Error("Invalid request");
                err.statusCode = 400;
                throw err;
            }
            loggedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isValid => {
            if(!isValid){
                const err = new Error("Invalid password");
                err.statusCode = 403;
                err.inputField = "cuPassword";
                throw err;
            }
            return bcrypt.hash(newPassword, 12);
        })
        .then(newPass => {
            loggedUser.password = newPass;
            return loggedUser.save();
        })
        .then(user => {
            return {
                title: "Account updated",
                message: "Your password has been updated successfully",
                icon: "success"
            };
        })
        .catch(err => {
            throw err;
        });
    }
};
const {buildSchema} = require('graphql');

module.exports = buildSchema(`

    input UpdatePassword{
        currentPass: String!
        newPass: String!
    }

    input UpdateInfo{
        username: String!
        email: String!
    }

    input Book{
        cleaningService: String!
        cleaningType: String!
        apartmentType: String!
        cleaningDate: String!
        number: String!
        serviceFrequency: String!
        serviceState: String!
        serviceLocation: String!
        notes: String!
    }

    input Contact{
        name: String!
        number: String!
        email: String!
        subject: String!
        message: String!
    }

    input NewPassword{
        userId: String!
        password: String!
        coPassword: String!
    }

    input ResetPassword{
        email: String!
    }

    input Login{
        email: String!
        password: String!
    }

    input Signup{
        username: String!
        email: String!
        password: String!
    }

    type notData{
        title: String!
        message: String!
        icon: String!
    }

    type Mutation{
        signup(userInput: Signup!): notData!
        login(userInput: Login!): String!
        resetPassword(userInput: ResetPassword!): notData!
        newPassword(userInput: NewPassword!): String!
        contact(userInput: Contact!): notData!
        book(userInput: Book!): notData!
        updateInfo(userInput: UpdateInfo!): notData!
        updatePassword(userInput: UpdatePassword!): notData!
    }

    type Query {
        name: String!
    }

    schema {
        query: Query
        mutation: Mutation
    }
`);
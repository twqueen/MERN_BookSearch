const {AuthenticationError} = require('apollo-server-express');
const {User} = require('../models');
const {signToken} = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({_id: context.user._id}).select('-__v -password').populate('savedBooks')
            }
            throw new AuthenticationError('You are not logged in :(');
        },
    },

    Mutation: {
        login: async (parent, {email, password}) => {
            // check if user exists by email
            const user = await User.findOne({email});
            if (!user){
                throw new AuthenticationError('No user found with this email');
            }
            // check password
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            // sign in if pass both
            const token = signToken(user);
            return {token, user};
        },
        addUser: async (parent, {username, email, password}) => {
            const user = await User.create({username, email, password});
            const token = signToken(user);
            return {token, user};
        },
        saveBook: async (parent, {input}, context) => {
            if (context.user) {
                const addBook = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$addtoSet: {savedBooks: input}},
                    {new: true, runValidators: true}
                );
                return addBook;
            }
            throw new AuthenticationError('You are not logged in.')
        },
        removeBook: async (parent, {bookId}, context) => {
            if (context.user) {
                const deleteBook = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: {savedBooks: {bookId: bookId}}},
                    {new: true}
                );
                return deleteBook;
            }
            throw new AuthenticationError('You are not logged in.')
        }
    }
};

module.exports = resolvers;
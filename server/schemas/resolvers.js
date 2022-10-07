const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // get single user
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = User.findOne({ _id: context.user._id})
                .select ('-__v -password')
                return userData;
            }
            throw new AuthenticationError('You need to be logged in!')
        }
    },
    Mutation: {
        // create user
        addUser: async (parent, {username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },
        // login
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });

            if(!user) {
                throw new AuthenticationError('No user found with this email address!')
            }

            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticationError('Incorrect credentials!');
            }
            
            const token = signToken(user);

            return { token, user };
        },
        // save book
        addBook: async (parent, { book }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id},
                    { $addtoSet: { savedBooks: book } },
                    { new: true }
                )
                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!')
        },
        // delete book
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndDelete(
                    { _id: context.user._id},
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                );

                return updatedUser;
            }
            throw new AuthenticationError('You need to be logged in!')
        },
    },
};

module.exports = resolvers;




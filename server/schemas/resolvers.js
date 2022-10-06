const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // get single user
        user: async (parent, { username }) => {
            return User.findOne({ username }).populate('savedBooks')
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
        addBook: async (parent, { description }, context) => {
            if (context.user) {
                const book = await Book.create({
                    authors,
                    description,
                    image,
                    link,
                    title
                })

                await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks} }
                );

                return book;
            }
            throw new AuthenticationError('You need to be logged in!')
        },
        // delete book
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const book = await Book.findOneAndDelete({
                    _id: bookId,
                    author: context.user.username,
                });

                await User.findOneAndUpdate(
                    { _id: context.user._id},
                    { $pull: {savedBooks: book._id }}
                );

                return book;
            }
            throw new AuthenticationError('You need to be logged in!')
        }
    }
}




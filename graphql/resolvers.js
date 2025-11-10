import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const resolvers = {
  // --- Field Level Resolvers for Relationships ---
  User: {
    posts: async (parent) => await Post.find({ author: parent.id }),
  },
  Post: {
    author: async (parent) => await User.findById(parent.author),
    comments: async (parent) => await Comment.find({ post: parent.id }),
  },
  Comment: {
    author: async (parent) => await User.findById(parent.author),
    post: async (parent) => await Post.findById(parent.post),
  },

  // --- Query Resolvers (Public) ---
  Query: {
    getAllUsers: () => User.find(),
    getUserById: (_, { id }) => User.findById(id),
    getAllPosts: () => Post.find(),
    getPostById: (_, { id }) => Post.findById(id),
    getPostsByUserId: (_, { userId }) => Post.find({ author: userId }),
    getAllComments: () => Comment.find(),
    getCommentById: (_, { id }) => Comment.findById(id),
  },

  // --- Mutation Resolvers (Auth + Protected) ---
  Mutation: {
    register: async (_, { name, email, password }) => {
      const user = new User({ name, email, password });
      await user.save();
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '1h',
      });
      return { token, user };
    },

    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '1h',
      });
      return { token, user };
    },

    updateUser: async (_, { name, email }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return User.findByIdAndUpdate(
        context.user.id,
        { ...(name && { name }), ...(email && { email }) },
        { new: true }
      );
    },

    deleteUser: async (_, __, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      await Post.deleteMany({ author: context.user.id });
      await Comment.deleteMany({ author: context.user.id });
      return User.findByIdAndDelete(context.user.id);
    },

    addPost: async (_, { title, content }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const post = new Post({ title, content, author: context.user.id });
      await post.save();
      return {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        author: context.user.id.toString(),
      };
    },

    updatePost: async (_, { id, title, content }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const post = await Post.findById(id);
      if (!post) throw new GraphQLError('Post not found');
      if (post.author.toString() !== context.user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return Post.findByIdAndUpdate(
        id,
        { ...(title && { title }), ...(content && { content }) },
        { new: true }
      );
    },

    deletePost: async (_, { id }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const post = await Post.findById(id);
      if (!post) throw new GraphQLError('Post not found');
      if (post.author.toString() !== context.user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      await Comment.deleteMany({ post: id });
      return Post.findByIdAndDelete(id);
    },
    addComment: async (_, { text, postId }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const post = await Post.findById(postId);
      if (!post) throw new GraphQLError('Post not found');

      const comment = new Comment({
        text,
        author: context.user.id,
        post: postId,
      });
      await comment.save();
      return {
        id: comment._id.toString(),
        text: comment.text,
        author: context.user.id.toString(),
        post: postId.toString(),
      };
    },

    updateComment: async (_, { id, text }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const comment = await Comment.findById(id);
      if (!comment) throw new GraphQLError('Comment not found');
      if (comment.author.toString() !== context.user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return Comment.findByIdAndUpdate(id, { text }, { new: true });
    },

    deleteComment: async (_, { id }, context) => {
      if (!context.user) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      const comment = await Comment.findById(id);
      if (!comment) throw new GraphQLError('Comment not found');
      if (comment.author.toString() !== context.user.id) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return Comment.findByIdAndDelete(id);
    },
  },
};

export const typeDefs = `#graphql
  # --- Main Types ---
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post]
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment]
  }

  type Comment {
    id: ID!
    text: String!
    author: User!
    post: Post!
  }

  # --- Auth Payload ---
  type AuthPayload {
    token: String!
    user: User!
  }

  # --- Queries ---
  type Query {
    # User Queries
    getAllUsers: [User]
    getUserById(id: ID!): User

    # Post Queries
    getAllPosts: [Post]
    getPostById(id: ID!): Post
    getPostsByUserId(userId: ID!): [Post]

    # Comment Queries
    getAllComments: [Comment]
    getCommentById(id: ID!): Comment
  }

  # --- Mutations ---
  type Mutation {
    # Auth Mutations
    register(name: String!, email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload

    # User Mutations (Protected)
    updateUser(name: String, email: String): User
    deleteUser: User

    # Post Mutations (Protected)
    addPost(title: String!, content: String!): Post
    updatePost(id: ID!, title: String, content: String): Post
    deletePost(id: ID!): Post

    # Comment Mutations (Protected)
    addComment(text: String!, postId: ID!): Comment
    updateComment(id: ID!, text: String): Comment
    deleteComment(id: ID!): Comment
  }
`;

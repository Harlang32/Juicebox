const { Client } = require("pg");
const { post } = require("../api");

const client = new Client({
  user: 'me',
  host: "postgres",
  database: "juicebox",
  password: "password",
  port: "5432",
  server_port: "3000"
});

async function getAllUsers(name, location) {
  const { rows } = await client.query(
    `SELECT id, * FROM users ORDER BY id ASC`
  );

  return rows;
}

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(`
      SELECT id, username, name, location, active
      FROM users
      WHERE id=${userId}
    `);

    if (!user) {
      return null;
    }

    user.posts = await getPostsByUser(userId);

    return user;
  } catch (error) {
    throw error;
  }
}

async function createUser({ username, password }) {
  try {
    const result = await client.query(
      `
      INSERT INTO users(username, password, name, location) 
      VALUES($1, $2) 
      ON CONFLICT (username) DO NOTHING 
      RETURNING *;
    `,
      ["some_name", "some_password"]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields = {}) {
  // build the set string
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [user],
    } = await client.query(
      `
      UPDATE users
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
      Object.values(fields)
    );

    return user;
  } catch (error) {
    throw error;
  }
}

async function createPost({
  authorId,
  title,
  content,
  tags = []
}) {
  try {
const {
  rows: [post],
} = await client.query(
  `INSERT INTO posts('authorId', title, content)
  VALUES($1, $2, $3)
  RETURNING *;
  `,
  [authorId, title, content]);

  const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
}

  async function updatePost(id, fields = {}) {

    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1}`
    ).join(', ');

      if (setString.length === 0) {
        return;
      }

  try {
    const { rows: [ post ] } = await client.query(
      `UPDATE POSTS
      SET ${ setString }
      WHERE id=${ id }
      RETURNING *;`, 
      Object.values(fields));
    
      return post;
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  try {
    const { rows } = await client.query(`
    SELECT *
    FROM posts;
    `);

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
      SELECT * 
      FROM posts
      WHERE "authorId"=${userId};
    `);

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
      SELECT *
      FROM posts
      WHERE id=$1;
    `,
      [postId]
    );

    // THIS IS NEW
    if (!post) {
      throw {
        name: "PostNotFoundError",
        message: "Could not find a post with that postId",
      };
    }
    // NEWNESS ENDS HERE

    const { rows: tags } = await client.query(
      `
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  getUserbyId,
  createPost,
  getAllPosts,
  getPostsByUser,
  getPostsById
};

const db = require('../config/database');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async () => {
  const users = await db('users')
    .select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
    .orderBy('created_at', 'desc');
  return users;
};

exports.createUser = async ({ name, email, password, role }) => {
  // Check if user already exists
  const existingUser = await db('users').where({ email }).first();
  if (existingUser) {
    const error = new Error('Email already in use');
    error.statusCode = 400;
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const [user] = await db('users')
    .insert({
      name,
      email,
      password_hash,
      role: role || 'user',
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning(['id', 'name', 'email', 'role', 'created_at', 'updated_at']);

  return user;
};

exports.updateUser = async (id, updateData) => {
  const dataToUpdate = {
    name: updateData.name,
    email: updateData.email,
    role: updateData.role,
    updated_at: db.fn.now(),
  };

  // Only hash and update password if provided
  if (updateData.password) {
    dataToUpdate.password_hash = await bcrypt.hash(updateData.password, 10);
  }

  await db('users')
    .where({ id })
    .update(dataToUpdate);

  const [user] = await db('users')
    .where({ id })
    .select('id', 'name', 'email', 'role', 'created_at', 'updated_at');

  return user;
};

exports.deleteUser = async (id) => {
  await db('users').where({ id }).del();
};

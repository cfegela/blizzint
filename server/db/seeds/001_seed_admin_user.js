const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Delete existing users
  await knex('users').del();

  // Insert admin user
  const passwordHash = await bcrypt.hash('admin123', 10);

  await knex('users').insert([
    {
      email: 'admin@blizzint.app',
      password_hash: passwordHash,
      name: 'Admin User',
      role: 'admin',
    }
  ]);
};

const fs = require('fs');
const path = require('path');

exports.seed = async function(knex) {
  // Delete existing ski resorts
  await knex('ski_resorts').del();

  // Load ski resorts data from JSON file
  const dataPath = path.join(__dirname, '../data/ski_resorts.json');
  const skiResortsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Insert ski resorts
  await knex('ski_resorts').insert(skiResortsData);
};

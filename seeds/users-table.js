// Update with your config settings.
require('dotenv').config();

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      return knex.raw('ALTER SEQUENCE users_id_seq RESTART WITH 1')
    })
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        { email: 'thomas@thomas.com', password: process.env.PASSWORD },
        { email: 'hollie@hollie.com', password: process.env.PASSWORD  },
        { email: 'ben@ben.com', password: process.env.PASSWORD  }
      ]);
    });
};

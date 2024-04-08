/* eslint-disable no-process-env */
const { parse } = require('pg-connection-string')

const defaults = {
  username: 'passemploi',
  password: 'passemploi',
  database: 'passemploidb',
  port: 55432
}
const defaultUrl = `postgresql://${defaults.username}:${defaults.password}@localhost:${defaults.port}/${defaults.database}`
const DATABASE_URL = process.env.DATABASE_URL || defaultUrl
const { host, port, database, user, password } = parse(DATABASE_URL)

let otherOptions = {}
if (process.env.ENVIRONMENT === 'staging') {
  otherOptions = {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
}

module.exports = {
  development: {
    username: user,
    password: password,
    database: database,
    host: 'localhost',
    port: port,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
    seederStorageTableName: 'sequelize_seeder',
    migrationStorageTableSchema: 'sequelize',
    seederStorageTableSchema: 'sequelize',
    logging: true
  },
  production: {
    username: user,
    password: password,
    database: database,
    host: host,
    port: port,
    dialect: 'postgres',
    migrationStorageTableName: 'sequelize_meta',
    seederStorageTableName: 'sequelize_seeder',
    migrationStorageTableSchema: 'sequelize',
    seederStorageTableSchema: 'sequelize',
    logging: false,
    ...otherOptions
  }
}

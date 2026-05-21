require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER || 'lagaao_user',
    password: process.env.DB_PASS || 'lagaao_pass',
    database: process.env.DB_NAME || 'lagaao',
    host:     process.env.DB_HOST || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    dialect:  'mysql',
    dialectOptions: { decimalNumbers: true },
    define: { underscored: true, paranoid: true, timestamps: true },
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    dialect:  'mysql',
    dialectOptions: { decimalNumbers: true },
    define: { underscored: true, paranoid: true, timestamps: true },
    logging: false,
  },
};

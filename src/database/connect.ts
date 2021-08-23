import mysql from 'mysql';
import dontenv from 'dotenv';

const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

conn.query(`
  CREATE TABLE IF NOT EXISTS ACCOUNTS (
    account_id INT(11) NOT NULL AUTO_INCREMENT,
    fid INT(15) NULL,
    ref INT(11) NULL,
    avatar VARCHAR(255) NULL,
    account_user VARCHAR(255) NOT NULL,
    account_pass VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NULL,
    gender INT(1) NULL,
    country VARCHAR(100) NULL,
    region VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    status INT(1) NOT NULL DEFAULT '1',
    likes_today INT(3) NOT NULL DEFAULT '0',
    follows_today INT(3) NOT NULL DEFAULT '0',
    next_use TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  )
`);

export default conn;

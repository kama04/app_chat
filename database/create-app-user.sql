CREATE DATABASE IF NOT EXISTS simple_chat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'simple_chat_user'@'localhost'
  IDENTIFIED BY 'change-this-database-password';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES
  ON simple_chat.*
  TO 'simple_chat_user'@'localhost';

FLUSH PRIVILEGES;

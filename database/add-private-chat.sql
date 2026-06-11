USE simple_chat;

SET @receiver_column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'messages'
    AND COLUMN_NAME = 'receiver_id'
);

SET @add_receiver_column = IF(
  @receiver_column_exists = 0,
  'ALTER TABLE messages ADD COLUMN receiver_id INT NULL AFTER user_id',
  'SELECT "messages.receiver_id already exists"'
);

PREPARE add_receiver_column_statement FROM @add_receiver_column;
EXECUTE add_receiver_column_statement;
DEALLOCATE PREPARE add_receiver_column_statement;

SET @receiver_constraint_exists = (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'messages'
    AND CONSTRAINT_NAME = 'fk_messages_receiver'
);

SET @add_receiver_constraint = IF(
  @receiver_constraint_exists = 0,
  'ALTER TABLE messages ADD CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "fk_messages_receiver already exists"'
);

PREPARE add_receiver_constraint_statement FROM @add_receiver_constraint;
EXECUTE add_receiver_constraint_statement;
DEALLOCATE PREPARE add_receiver_constraint_statement;

const pool = require('./db');

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return rows[0].count > 0;
}

async function constraintExists(constraintName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
       FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'messages'
        AND CONSTRAINT_NAME = ?`,
    [constraintName]
  );

  return rows[0].count > 0;
}

async function ensurePrivateChatSchema() {
  const hasReceiverColumn = await columnExists('messages', 'receiver_id');

  if (!hasReceiverColumn) {
    await pool.execute('ALTER TABLE messages ADD COLUMN receiver_id INT NULL AFTER user_id');
    console.log('Added messages.receiver_id column.');
  }

  const hasReceiverConstraint = await constraintExists('fk_messages_receiver');

  if (!hasReceiverConstraint) {
    await pool.execute(
      `ALTER TABLE messages
         ADD CONSTRAINT fk_messages_receiver
         FOREIGN KEY (receiver_id) REFERENCES users(id)
         ON DELETE CASCADE`
    );
    console.log('Added fk_messages_receiver foreign key.');
  }
}

module.exports = {
  ensurePrivateChatSchema
};

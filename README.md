# Simple Real-Time Chat

A beginner-friendly chat application inspired by Telegram. It uses Node.js, Express, Handlebars, Bootstrap, Socket.IO, MySQL, JWT authentication, password hashing, and image uploads.

## Features

- Register with username, email, and password
- Login with JWT stored in an HTTP-only cookie
- Protected chat page
- Private real-time text and image messages with Socket.IO
- Online users sidebar with clickable private chats
- Emoji keyboard in the message composer
- Image preview before sending
- MySQL storage for users, messages, and image paths
- Responsive Bootstrap UI

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the database:

   ```bash
   mysql -u root -p < database/schema.sql
   ```

   On a Linux server, create a dedicated MySQL user:

   ```bash
   sudo mysql < database/create-app-user.sql
   ```

   Or start MySQL with Docker:

   ```bash
   docker compose up -d
   ```

3. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MySQL credentials and a strong `JWT_SECRET`.

   Example server `.env`:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=simple_chat_user
   DB_PASSWORD=change-this-database-password
   DB_NAME=simple_chat
   JWT_SECRET=change-this-to-a-long-random-secret
   JWT_EXPIRES_IN=7d
   ```

   If you already created the database before private chat was added, run this once:

   ```bash
   mysql -u root simple_chat < database/add-private-chat.sql
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

   For production:

   ```bash
   npm run build
   npm start
   ```

6. Open:

   ```text
   http://localhost:3000
   ```

## Project Structure

```text
src/
  config/       MySQL connection pool
  middleware/   JWT page protection
  routes/       Auth, chat, and upload routes
  server.js     Express and Socket.IO startup
views/          Handlebars layouts and pages
public/         CSS, browser JavaScript, and uploaded images
database/       MySQL schema
```

## Notes

- Uploaded images are stored in `public/uploads`.
- JWTs are created after registration/login and stored in an HTTP-only cookie.
- For testing after login, open `/api/token` to see the current JWT.
- For production, use HTTPS, set `secure: true` for cookies, limit upload size more strictly, and serve uploads from durable storage.

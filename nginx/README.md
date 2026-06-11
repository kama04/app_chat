# Nginx Setup

This config proxies `wywiwyg.net` to the Node.js chat app on port `4744`.

## Install

```bash
sudo cp nginx/simple-chat.conf /etc/nginx/sites-available/simple-chat
sudo ln -s /etc/nginx/sites-available/simple-chat /etc/nginx/sites-enabled/simple-chat
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS with Certbot

Use your email address for certificate notices:

```bash
sudo certbot --nginx -d wywiwyg.net -d www.wywiwyg.net --email kamila-www@wywiwyg.net
```

## App Port

Make sure the Node app is running on:

```text
http://127.0.0.1:4744
```

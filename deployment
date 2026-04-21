# 🚀 Flask Backend Deployment (EC2 + CI/CD + Gunicorn + Nginx + HTTPS)

This guide covers:

* ✅ CI/CD deployment using GitHub Actions
* ✅ Manual SCP upload (fallback method)
* ✅ Flask setup with Gunicorn
* ✅ Nginx reverse proxy
* ✅ HTTPS with Certbot

---

# 🔄 Step 0: CI/CD Pipeline (GitHub → EC2)

## 🔹 GitHub Secrets

Go to **Repo → Settings → Secrets → Actions** and add:

```
EC2_HOST = your-ec2-ip
EC2_USER = falcon
EC2_KEY  = (paste full .pem content)
```

---

## 🔹 GitHub Workflow

Create file:

```
.github/workflows/deploy.yml
```

```yaml
name: Deploy Flask App

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.10
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USER }}
        key: ${{ secrets.EC2_KEY }}
        script: |
          cd /home/falcon/backend
          git pull origin main
          source venv/bin/activate
          pip install -r requirements.txt
          sudo systemctl restart flaskapp
```

---

## 🔹 How it works

```
git push → GitHub Actions → SSH → EC2 → Pull → Restart
```

---

# 📦 Step 1: Upload & Setup Backend (Manual SCP Method)

## 🔹 Upload project

```bash
scp -i C:\Users\hp\Downloads\ieee_quiz.pem backend.rar ubuntu@your-ec2-ip:/home/ubuntu
```

---

## 🔹 Extract files

```bash
sudo apt update
sudo apt install unrar -y
unrar x backend.rar
```

---

## 🔹 Setup Python virtual environment

```bash
sudo apt install python3-venv -y
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🔹 Install & test Gunicorn

```bash
pip install gunicorn
gunicorn --bind 0.0.0.0:5000 run:app
```

👉 Test:

```
http://your-ec2-ip:5000
```

---

# 🔧 Step 2: Setup Systemd Service

```bash
sudo nano /etc/systemd/system/flaskapp.service
```

### Service File

```ini
[Unit]
Description=Flask App
After=network.target

[Service]
User=falcon
Group=www-data
WorkingDirectory=/home/falcon/backend
Environment="PATH=/home/falcon/backend/venv/bin"

ExecStart=/home/falcon/backend/venv/bin/gunicorn \
-k geventwebsocket.gunicorn.workers.GeventWebSocketWorker \
-w 1 \
--bind 127.0.0.1:5000 \
run:app

[Install]
WantedBy=multi-user.target

```

---

## 🔹 Start service

```bash
sudo systemctl daemon-reload
sudo systemctl start flaskapp
sudo systemctl enable flaskapp
```

---

# ⚙️ Step 3: Setup Nginx (Port 80)

## 🔹 Install Nginx

```bash
sudo apt install nginx -y
```

---

## 🔹 Create config

```bash
sudo nano /etc/nginx/sites-available/flaskapp
```

### Nginx Config (HTTP)

```nginx
server {
    listen 80;

    location / {
        proxy_pass http://127.0.0.1:5000;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

location /socket.io/ {
    proxy_pass http://127.0.0.1:5000/socket.io/;

    proxy_http_version 1.1;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

---

## 🔹 Enable config

```bash
sudo ln -s /etc/nginx/sites-available/flaskapp /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

for cors 
update in env ,config.py(socket.io/)
---

## 🔹 Remove default config

```bash
sudo rm /etc/nginx/sites-enabled/default
```

---

# 🧠 Worker Rule

```
workers = (2 × CPU cores) + 1
```

---

# 🔐 Step 4: Enable HTTPS (Port 443)

## 🔹 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 🔹 Update Nginx config

```bash
sudo nano /etc/nginx/sites-available/flaskapp
```

Add your domain:

```nginx
server_name confrence.bhook.food;
```

---

## 🔹 Install SSL

```bash
sudo certbot --nginx -d domain
```

👉 Choose:

```
Redirect HTTP → HTTPS → YES
```

---

# 🎉 Final Result

```
https://domain
```

---

# ⚠️ Important Notes

* Ensure DNS → EC2 IP (A record)
* Open ports:

  * 80 (HTTP)
  * 443 (HTTPS)
* Gunicorn must be running before Nginx

---

# 🧪 Debug Commands

```bash
sudo systemctl status flaskapp
journalctl -u flaskapp -f
sudo nginx -t
```

---

# 🧠 Architecture

```
Client (HTTPS)
      ↓
Nginx (80/443)
      ↓
Gunicorn (127.0.0.1:5000)
      ↓
Flask App
```

---

# 🔥 Done ✅

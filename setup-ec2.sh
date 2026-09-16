#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# TrendXee EC2 One-Time Setup Script
# Run this ONCE on a fresh Ubuntu 24 t3.micro instance.
# Usage:  chmod +x setup-ec2.sh && ./setup-ec2.sh
# ──────────────────────────────────────────────────────────────
set -euo pipefail

echo "──── 1. System update ────"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "──── 2. Install Docker ────"
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Let current user run docker without sudo
sudo usermod -aG docker "$USER"
echo "✅ Docker installed. You may need to log out and back in for the group change."

echo "──── 3. Install Nginx & Certbot ────"
sudo apt-get install -y nginx python3-certbot-nginx
sudo systemctl enable nginx

echo "──── 4. Create project directory ────"
mkdir -p ~/trendxee
cd ~/trendxee

echo "──── 5. Generate RSA keypair for JWT ────"
if [ ! -f private.pem ]; then
  openssl genrsa -out private.pem 2048
  openssl rsa -in private.pem -pubout -out public.pem
  chmod 600 private.pem
  chmod 644 public.pem
  echo "✅ RSA keys generated (private.pem & public.pem)"
else
  echo "⏭️  RSA keys already exist, skipping"
fi

echo "──── 6. Create placeholder .env ────"
if [ ! -f .env ]; then
cat > .env << 'ENVEOF'
# ═══════════════════════════════════════════════════
# TrendXee Production Environment Variables
# Fill in ALL values below before deploying.
# ═══════════════════════════════════════════════════

# --- Databases ---
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/trendzy
DATABASE_URL=jdbc:postgresql://<host>:5432/<dbname>
DB_USERNAME=<your_pg_user>
DB_PASSWORD=<your_pg_password>

# --- Application Ports ---
API_PORT=8080
BUSINESS_PORT=8081

# --- Frontend & Cross-Origin ---
FRONTEND_URL=https://trendxee.com

# --- Google OAuth2 ---
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# --- Security & Cookies ---
APP_ADMIN_EMAILS=
COOKIE_DOMAIN=.trendxee.com
COOKIE_SECURE=true
JWT_PRIVATE_KEY_PATH=file:/run/secrets/trendzy-private.pem
JWT_PUBLIC_KEY_PATH=file:/run/secrets/trendzy-public.pem
ENVEOF
  echo "✅ .env template created — EDIT IT with your real values!"
else
  echo "⏭️  .env already exists, skipping"
fi

echo "──── 7. Add 1 GB swap (safety net for t3.micro) ────"
if [ ! -f /swapfile ]; then
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  echo "✅ 1 GB swap enabled"
else
  echo "⏭️  Swap already exists, skipping"
fi

echo ""
echo "══════════════════════════════════════════════════"
echo "  ✅ EC2 setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Log out and back in (for docker group)"
echo "  2. nano ~/trendxee/.env   ← fill in real values"
echo "  3. Set up Nginx (see deploy guide)"
echo "  4. Push to master → GitHub Actions will deploy"
echo "══════════════════════════════════════════════════"

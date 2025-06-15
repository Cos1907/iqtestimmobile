#!/bin/bash

# Ubuntu Sunucu Kurulum Scripti - IQ Test Admin Panel ve API
# Bu script Ubuntu 20.04+ için hazırlanmıştır

echo "=== IQ Test Admin Panel ve API Kurulum Scripti ==="
echo "Bu script Ubuntu sunucunuzda gerekli tüm bileşenleri kuracaktır."
echo ""

# Root kontrolü
if [ "$EUID" -ne 0 ]; then
    echo "Bu script root yetkisi gerektirir. 'sudo' ile çalıştırın."
    exit 1
fi

# Sistem güncellemesi
echo "1. Sistem güncelleniyor..."
apt update && apt upgrade -y

# Gerekli paketlerin kurulumu
echo "2. Gerekli paketler kuruluyor..."
apt install -y curl wget git nginx software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Node.js 18.x kurulumu
echo "3. Node.js 18.x kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# MongoDB kurulumu (MongoDB Atlas kullanacağımız için local MongoDB'yi kurmuyoruz)
echo "4. MongoDB Atlas kullanılacak, local MongoDB kurulmuyor..."

# PM2 kurulumu (Process Manager)
echo "5. PM2 kuruluyor..."
npm install -g pm2

# UFW Firewall kurulumu ve yapılandırması
echo "6. Firewall yapılandırılıyor..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw allow 5000
ufw --force enable

# Nginx yapılandırması - Admin Panel için
echo "7. Nginx yapılandırması yapılıyor..."
cat > /etc/nginx/sites-available/mobil.iqtestim.com << 'EOF'
server {
    listen 80;
    server_name mobil.iqtestim.com;

    # Admin Panel
    location / {
        root /var/www/iqtestim/admin-panel/build;
        try_files $uri $uri/ /index.html;
        index index.html index.htm;
    }

    # Uploads klasörü
    location /uploads {
        alias /var/www/iqtestim/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip sıkıştırma
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Nginx yapılandırması - API için
cat > /etc/nginx/sites-available/api.iqtestim.com << 'EOF'
server {
    listen 80;
    server_name api.iqtestim.com;

    # API Proxy
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout ayarları
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads klasörü
    location /uploads {
        alias /var/www/iqtestim/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip sıkıştırma
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Nginx site'larını etkinleştir
ln -sf /etc/nginx/sites-available/mobil.iqtestim.com /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.iqtestim.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx syntax kontrolü ve yeniden başlatma
nginx -t && systemctl reload nginx

# Proje dizinlerini oluştur
echo "8. Proje dizinleri oluşturuluyor..."
mkdir -p /var/www/iqtestim
mkdir -p /var/www/iqtestim/uploads
mkdir -p /var/www/iqtestim/uploads/blog
mkdir -p /var/www/iqtestim/uploads/users
mkdir -p /var/www/iqtestim/uploads/tests
chown -R www-data:www-data /var/www/iqtestim
chmod -R 755 /var/www/iqtestim

echo ""
echo "=== Kurulum Tamamlandı ==="
echo ""
echo "Kurulum tamamlandı! Şimdi yapmanız gerekenler:"
echo ""
echo "1. Proje dosyalarını /var/www/iqtestim/ dizinine kopyalayın:"
echo "   - Backend: /var/www/iqtestim/backend/"
echo "   - Admin Panel: /var/www/iqtestim/admin-panel/"
echo ""
echo "2. Backend için .env dosyası oluşturun:"
echo "   NODE_ENV=production"
echo "   PORT=5000"
echo "   MONGO_URI=mongodb+srv://iqtestimmobil:asil12345-@cluster0.9vevl2v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
echo "   JWT_SECRET=your-secret-key-here"
echo ""
echo "3. Admin panel için build alın:"
echo "   cd /var/www/iqtestim/admin-panel"
echo "   npm install"
echo "   npm run build"
echo ""
echo "4. Backend'i başlatın:"
echo "   cd /var/www/iqtestim/backend"
echo "   npm install"
echo "   pm2 start server.js --name iqtestim-api"
echo ""
echo "5. PM2'yi sistem başlangıcında otomatik başlatın:"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "6. SSL sertifikaları alın:"
echo "   certbot --nginx -d mobil.iqtestim.com"
echo "   certbot --nginx -d api.iqtestim.com"
echo ""
echo "Kurulum tamamlandı!" 
#!/bin/bash

# IQ Test Admin Panel ve API Deployment Scripti
# Bu script Ubuntu sunucunuzda projeyi deploy eder

echo "=== IQ Test Deployment Scripti ==="
echo ""

# Root kontrolü
if [ "$EUID" -ne 0 ]; then
    echo "Bu script root yetkisi gerektirir. 'sudo' ile çalıştırın."
    exit 1
fi

# Log dizinlerini oluştur
echo "1. Log dizinleri oluşturuluyor..."
mkdir -p /var/log/iqtestim
chown -R www-data:www-data /var/log/iqtestim

# Nginx'i yeniden başlat
nginx -t && systemctl reload nginx

# Backend deployment
echo "2. Backend kuruluyor..."
cd /var/www/iqtestim/backend

# .env dosyası oluştur
if [ ! -f .env ]; then
    echo "3. .env dosyası oluşturuluyor..."
    cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://iqtestimmobil:asil12345-@cluster0.9vevl2v.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=$(openssl rand -base64 32)
EOF
fi

# Dependencies kur
echo "4. Backend dependencies kuruluyor..."
npm install --production

# PM2 ile başlat
echo "5. Backend PM2 ile başlatılıyor..."
pm2 delete iqtestim-api 2>/dev/null || true
pm2 start ecosystem.config.js --env production

# Admin Panel deployment
echo "6. Admin Panel kuruluyor..."
cd /var/www/iqtestim/admin-panel

# Dependencies kur
echo "7. Admin Panel dependencies kuruluyor..."
npm install

# Build al
echo "8. Admin Panel build alınıyor..."
npm run build

# İzinleri düzenle
echo "9. İzinler düzenleniyor..."
chown -R www-data:www-data /var/www/iqtestim
chmod -R 755 /var/www/iqtestim

# PM2'yi sistem başlangıcında otomatik başlat
echo "10. PM2 sistem başlangıcında otomatik başlatılıyor..."
pm2 startup
pm2 save

# SSL sertifikası için Certbot kurulumu
echo "11. SSL sertifikası kurulumu..."
apt install -y certbot python3-certbot-nginx

# SSL sertifikaları al
echo "12. SSL sertifikaları alınıyor..."
certbot --nginx -d mobil.iqtestim.com --non-interactive --agree-tos --email admin@iqtestim.com
certbot --nginx -d api.iqtestim.com --non-interactive --agree-tos --email admin@iqtestim.com

# Firewall'u güncelle
echo "13. Firewall güncelleniyor..."
ufw allow 'Nginx Full'

echo ""
echo "=== Deployment Tamamlandı ==="
echo ""
echo "Projeniz başarıyla deploy edildi!"
echo ""
echo "Admin Panel: https://mobil.iqtestim.com"
echo "API: https://api.iqtestim.com"
echo "Health Check: https://api.iqtestim.com/health"
echo ""
echo "PM2 Durumu:"
pm2 status
echo ""
echo "Nginx Durumu:"
systemctl status nginx --no-pager
echo ""
echo "Log dosyaları:"
echo "- PM2 Logs: pm2 logs iqtestim-api"
echo "- Nginx Logs: /var/log/nginx/"
echo "- App Logs: /var/log/iqtestim/"
echo ""
echo "Deployment tamamlandı!" 
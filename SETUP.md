# Configuration Setup - LeDoc54 Mini App

## Variables d'environnement requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
# Configuration Telegram Bot
# Obtenez votre token depuis @BotFather sur Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Votre Chat ID Telegram pour recevoir les notifications
# Envoyez un message à votre bot, puis visitez: https://api.telegram.org/bot<TOKEN>/getUpdates
# Trouvez votre chat.id dans la réponse
ADMIN_CHAT_ID=your_chat_id_here

# Configuration Serveur
PORT=3000

# Configuration App
NODE_ENV=production
```

## Guide de configuration étape par étape

### 1. Créer un Bot Telegram

1. **Ouvrez Telegram** et cherchez `@BotFather`
2. **Envoyez** `/start` puis `/newbot`
3. **Choisissez un nom** pour votre bot : `LeDoc54 Shop Bot`
4. **Choisissez un username** : `ledoc54shop_bot` (doit finir par _bot)
5. **Copiez le token** et ajoutez-le dans votre `.env`

### 2. Configurer la Mini App

1. **Envoyez** `/newapp` à @BotFather
2. **Sélectionnez** votre bot
3. **Nom de l'app** : `LeDoc54 Shop`
4. **Description** : `Boutique en ligne LeDoc54 - Ecaille, Indian Pharma K, Cali US`
5. **Photo** : Uploadez le logo de votre boutique (optionnel)
6. **URL de l'app** : `https://votre-domaine.com`

### 3. Obtenir votre Chat ID

**Méthode 1 - Via API :**
1. Envoyez un message à votre bot
2. Visitez : `https://api.telegram.org/bot<VOTRE_TOKEN>/getUpdates`
3. Cherchez `"chat":{"id":123456789` dans la réponse
4. Le nombre après `"id":` est votre Chat ID

**Méthode 2 - Via @userinfobot :**
1. Cherchez `@userinfobot` sur Telegram
2. Envoyez `/start`
3. Votre ID utilisateur sera affiché

### 4. Configuration du webhook (Production)

Pour recevoir les notifications en production :

```bash
curl -X POST "https://api.telegram.org/bot<VOTRE_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://votre-domaine.com/webhook"}'
```

### 5. Test de configuration

Testez votre configuration avec :

```bash
# Vérifier le bot
curl "https://api.telegram.org/bot<VOTRE_TOKEN>/getMe"

# Tester l'envoi de message
curl -X POST "https://api.telegram.org/bot<VOTRE_TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"<VOTRE_CHAT_ID>","text":"Test LeDoc54 Bot"}'
```

## Configuration serveur recommandée

### Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 (Gestionnaire de processus)

```bash
# Installer PM2
npm install -g pm2

# Démarrer l'app
pm2 start server.js --name "ledoc54"

# Configuration auto-start
pm2 startup
pm2 save
```

### SSL/HTTPS avec Certbot

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Auto-renouvellement
sudo crontab -e
# Ajouter : 0 12 * * * /usr/bin/certbot renew --quiet
```

## Sécurité

### Recommendations
- Utilisez HTTPS en production
- Gardez vos tokens secrets
- Limitez l'accès à l'interface admin
- Sauvegardez régulièrement la base de données

### Firewall (UFW)
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Monitoring

### Logs PM2
```bash
pm2 logs ledoc54
pm2 monit
```

### Monitoring système
```bash
# Voir l'utilisation des ressources
htop

# Espace disque
df -h

# Logs système
journalctl -u nginx
```

## Sauvegarde

### Base de données
```bash
# Sauvegarder
cp database/ledoc54.db backup/ledoc54_$(date +%Y%m%d).db

# Automatiser (crontab)
0 2 * * * cp /path/to/app/database/ledoc54.db /path/to/backup/ledoc54_$(date +\%Y\%m\%d).db
```

### Images
```bash
# Sauvegarder le dossier uploads
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz uploads/
```

## Dépannage

### Problèmes courants

**Bot ne répond pas :**
- Vérifiez le token dans `.env`
- Testez avec l'API Telegram directement
- Vérifiez les logs : `pm2 logs ledoc54`

**Notifications non reçues :**
- Vérifiez le Chat ID
- Testez l'envoi manuel de message
- Vérifiez la configuration webhook

**Interface non accessible :**
- Vérifiez nginx : `sudo systemctl status nginx`
- Vérifiez l'app : `pm2 status`
- Vérifiez les logs : `sudo tail -f /var/log/nginx/error.log`

### Commandes utiles

```bash
# Redémarrer l'app
pm2 restart ledoc54

# Voir les processus
pm2 list

# Redémarrer nginx
sudo systemctl restart nginx

# Voir l'état du système
systemctl status nginx
systemctl status pm2-root
```

## Support

En cas de problème persistant :
1. Vérifiez les logs d'erreur
2. Consultez la documentation officielle Telegram
3. Testez les endpoints API manuellement
4. Vérifiez la configuration réseau/firewall

---

**Configuration terminée !** Votre boutique LeDoc54 est prête à fonctionner. 🚀 
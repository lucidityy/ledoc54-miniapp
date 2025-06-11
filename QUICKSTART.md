# 🚀 QuickStart - LeDoc54 Mini App

Démarrage rapide en 5 minutes !

## ⚡ Installation Express

```bash
# 1. Installer les dépendances
npm install

# 2. Créer les dossiers nécessaires (déjà fait)
# mkdir uploads database

# 3. Initialiser la base de données avec produits d'exemple
npm run init-db

# 4. Créer le fichier .env avec vos tokens
# Copiez et modifiez les variables ci-dessous
```

## 📝 Configuration .env

Créez un fichier `.env` avec :

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_chat_id_here
PORT=3000
NODE_ENV=development
```

## 🤖 Configuration Telegram (5 minutes)

### 1. Créer le bot
- Ouvrez Telegram → @BotFather
- `/newbot` → Nom: `LeDoc54 Shop Bot`
- Username: `ledoc54shop_bot`
- **Copiez le token** dans `.env`

### 2. Obtenir votre Chat ID
- Envoyez un message à votre bot
- Visitez: `https://api.telegram.org/bot<TOKEN>/getUpdates`
- Trouvez votre `chat.id` → ajoutez dans `.env`

### 3. Configurer la Mini App
- @BotFather → `/newapp`
- Sélectionnez votre bot
- URL: `https://votre-domaine.com` (ou localhost pour test)

## 🏃‍♂️ Démarrer l'application

```bash
# Mode développement
npm run dev

# Ou mode production
npm start
```

**Votre app sera accessible sur :**
- 🛒 **Client** : http://localhost:3000
- ⚙️ **Admin** : http://localhost:3000/admin

## 🧪 Test rapide

1. **Interface client** : Ouvrez http://localhost:3000
2. **Ajoutez des produits** au panier
3. **Passez une commande** test
4. **Vérifiez l'admin** : http://localhost:3000/admin
5. **Notification Telegram** reçue ! ✅

## 📦 Produits inclus par défaut

- **Ecaille Premium** - 45€ (Stock: 15)
- **Ecaille Classic** - 35€ (Stock: 20)
- **Indian Pharma K Original** - 55€ (Stock: 10)
- **Indian Pharma K Enhanced** - 65€ (Stock: 8)
- **Cali US Blue** - 70€ (Stock: 12)
- **Cali US Green** - 70€ (Stock: 12)
- **Cali US Purple** - 85€ (Stock: 5)

## 🎯 Prochaines étapes

1. **Personnalisez** vos produits via l'admin
2. **Ajustez** les lieux de retrait dans `public/index.html`
3. **Déployez** sur votre serveur (voir README.md)
4. **Configurez** le webhook Telegram
5. **Testez** avec de vrais clients !

## 🆘 Problème ?

- **App ne démarre pas** : `npm install` puis `npm run init-db`
- **Bot ne répond pas** : Vérifiez le token dans `.env`
- **Pas de notifications** : Vérifiez le Chat ID

---

**🎉 Félicitations ! LeDoc54 est opérationnel !**

Consultez le `README.md` pour la configuration avancée et le déploiement. 
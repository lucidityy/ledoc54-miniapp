# LeDoc54 - Telegram Mini App E-commerce

Une application de vente complète intégrée à Telegram pour LeDoc54, permettant de vendre vos produits (Ecaille, Indian Pharma K, Cali US) directement via Telegram avec paiement en espèces.

## 🚀 Fonctionnalités

### Interface Client (Mini App)
- **Catalogue produits** avec filtres par catégorie
- **Gestion du panier** avec ajout/suppression d'articles
- **Système de commande** avec choix livraison/retrait
- **Paiement en espèces** uniquement
- **Interface mobile** optimisée pour Telegram
- **Gestion automatique du stock**

### Interface Admin (Web)
- **Gestion des produits** (ajout, modification, stock)
- **Gestion des commandes** (statuts, détails)
- **Gestion de l'inventaire** avec historique
- **Statistiques en temps réel**
- **Notifications Telegram** automatiques

### Système de notification
- **Notifications instantanées** via Telegram
- **Détails complets** des commandes
- **Mises à jour de statut** en temps réel

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- Un bot Telegram (créé via @BotFather)
- Un serveur web accessible depuis Internet

## 🛠️ Installation

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd miniappdoc
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Créer le fichier d'environnement
```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos informations :
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_chat_id_here
PORT=3000
```

### 4. Initialiser la base de données
```bash
npm run init-db
```

### 5. Créer le dossier uploads
```bash
mkdir uploads
```

### 6. Démarrer l'application
```bash
# En mode développement
npm run dev

# En mode production
npm start
```

## 🤖 Configuration Telegram

### 1. Créer un bot Telegram
1. Ouvrez Telegram et cherchez @BotFather
2. Envoyez `/newbot`
3. Suivez les instructions pour nommer votre bot
4. Récupérez le token du bot
5. Ajoutez-le dans votre fichier `.env`

### 2. Configurer le Mini App
1. Envoyez `/newapp` à @BotFather
2. Sélectionnez votre bot
3. Donnez un nom à votre app : "LeDoc54 Shop"
4. Description : "Boutique en ligne LeDoc54"
5. Photo : Ajoutez le logo de votre boutique
6. Définissez l'URL de votre app : `https://votre-domaine.com`

### 3. Récupérer votre Chat ID
1. Envoyez un message à votre bot
2. Visitez : `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Trouvez votre `chat.id` dans la réponse
4. Ajoutez-le dans `.env` comme `ADMIN_CHAT_ID`

## 🌐 Déploiement

### Option 1: Hébergement VPS
1. Uploadez le code sur votre serveur
2. Installez Node.js et PM2
3. Configurez nginx comme reverse proxy
4. Démarrez avec PM2 : `pm2 start server.js --name ledoc54`

### Option 2: Heroku
1. Créez une app Heroku
2. Ajoutez les variables d'environnement
3. Déployez : `git push heroku main`

### Option 3: Railway/Render
1. Connectez votre repo GitHub
2. Configurez les variables d'environnement
3. Déployez automatiquement

## 📱 Utilisation

### Pour les clients
1. Ouvrez Telegram
2. Cherchez votre bot
3. Cliquez sur "Menu" ou envoyez `/start`
4. L'interface de boutique s'ouvre
5. Parcourez, ajoutez au panier, commandez

### Pour l'admin
1. Accédez à `https://votre-domaine.com/admin`
2. Gérez vos produits et commandes
3. Recevez les notifications dans Telegram

## 📊 Gestion des produits

### Produits par défaut
Le système inclut des produits d'exemple :
- **Ecaille** : Premium (45€), Classic (35€)
- **Indian Pharma K** : Original (55€), Enhanced (65€)
- **Cali US** : Blue/Green (70€), Purple (85€)

### Ajouter des produits
1. Panneau Admin → Produits → Ajouter
2. Remplissez les informations
3. Ajoutez une image (optionnel)
4. Définissez le stock initial

## 📦 Gestion des commandes

### Flux de commande
1. **En attente** → Nouvelle commande reçue
2. **Confirmée** → Commande validée par l'admin
3. **Livrée** → Commande terminée
4. **Annulée** → Commande annulée

### Notifications automatiques
- Nouvelle commande → Notification Telegram instantanée
- Détails complets : client, produits, total, livraison
- Possibilité de répondre directement au client

## 🔧 Configuration avancée

### Personnalisation
- Modifiez les couleurs dans `styles.css`
- Ajustez les catégories dans `init-db.js`
- Personnalisez les lieux de retrait dans `index.html`

### Sécurité
- Changez les tokens par défaut
- Utilisez HTTPS en production
- Limitez l'accès à l'interface admin

## 🐛 Dépannage

### Problèmes courants
1. **Bot ne répond pas** : Vérifiez le token et l'URL
2. **Base de données** : Réinitialisez avec `npm run init-db`
3. **Images non affichées** : Vérifiez le dossier `uploads`
4. **Notifications** : Vérifiez le `ADMIN_CHAT_ID`

### Logs
```bash
# Voir les logs PM2
pm2 logs ledoc54

# Logs en développement
npm run dev
```

## 📈 Statistiques disponibles

- Ventes du jour
- Commandes en attente
- Produits en rupture de stock
- Stock faible (≤ 5 unités)
- Historique des mouvements de stock
- Activité récente

## 💡 Fonctionnalités à venir

- [ ] Système de promotions avancé
- [ ] Notifications SMS
- [ ] Intégration comptabilité
- [ ] Gestion multi-vendeurs
- [ ] Application mobile native
- [ ] Paiements en ligne

## 🆘 Support

En cas de problème :
1. Vérifiez les logs d'erreur
2. Consultez la documentation Telegram
3. Testez les API endpoints manuellement

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Ouvrez une issue ou proposez une pull request.

---

**LeDoc54** - Solution e-commerce Telegram complète 🛒📱 
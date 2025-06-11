# 🚀 Deploy LeDoc54 Mini App

## Quick Deploy to Render (FREE)

### 1. Prepare your code
```bash
# Make sure everything works locally first
npm run dev
```

### 2. Push to GitHub
```bash
git init
git add .
git commit -m "LeDoc54 Mini App ready for deployment"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOURUSERNAME/ledoc54-miniapp.git
git push -u origin main
```

### 3. Deploy on Render
1. Go to [render.com](https://render.com) → Sign up
2. **New** → **Web Service**
3. **Connect GitHub** → Select your repo
4. **Settings**:
   - **Name**: `ledoc54-miniapp`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run init-db`
   - **Start Command**: `npm start`

5. **Environment Variables**:
   ```
   TELEGRAM_BOT_TOKEN = 8148980887:AAHsj4PrLhCbflT_O_ivZEJSca6vbs21B6w
   ADMIN_CHAT_ID = 1823225052
   NODE_ENV = production
   ```

6. **Deploy** → Wait 5 minutes

### 4. Get your URL
You'll get: `https://ledoc54-miniapp.onrender.com`

### 5. Configure Telegram Mini App
1. Telegram → `@BotFather`
2. `/newapp` → Select your bot
3. **URL**: `https://ledoc54-miniapp.onrender.com`
4. Save

### 6. Test your Mini App
1. Open your bot in Telegram
2. You should see a "Menu" button
3. Click it → Your shop opens!

---

## Alternative: Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/ledoc54-miniapp)

1. Click the button above
2. Add environment variables
3. Deploy
4. Configure BotFather with the Railway URL

---

## Alternative: One-Click Render Deploy

If you have `render.yaml` in your repo:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## Important Notes

### ✅ Requirements Met
- **HTTPS**: ✅ (Automatic on Render/Railway)
- **Node.js**: ✅ (Specified in package.json)
- **Database**: ✅ (SQLite, created on build)
- **Environment**: ✅ (Production ready)

### 📱 After Deployment
Your mini app will be available at:
- **Client Interface**: `https://your-app.onrender.com`
- **Admin Panel**: `https://your-app.onrender.com/admin`

### 🔄 Updates
To update your app:
```bash
git add .
git commit -m "Update"
git push
```
Render will auto-deploy!

---

## Troubleshooting

**App not loading?**
- Check Render logs
- Verify environment variables
- Test locally first

**Bot not responding?**
- Check BotFather configuration
- Verify HTTPS URL
- Test with `/start` command

**Database issues?**
- Check build logs
- Verify `npm run init-db` ran
- Check disk space

---

**🎉 Your LeDoc54 shop will be live in 10 minutes!** 
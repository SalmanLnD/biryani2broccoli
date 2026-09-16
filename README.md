# Biryani2Broccoli

A working diet and gym tracker for weight loss, South Indian food logging, and strength training. Calorie and macro targets are calculated from your profile (Mifflin-St Jeor BMR × activity factor). Nutrition values are **estimates**.

The interface follows the Healthify-style home: remaining calories in a ring, four macro rings, a date strip, meal rows with a green + control, and a mobile bottom bar / desktop sidebar.

## Local run

You need Node 18+ and MongoDB (Atlas free tier or local).

```bash
cp .env.example .env
# set MONGODB_URI and JWT_SECRET
npm install
npm run install:all
npm run dev
```

App: http://localhost:5180  
API: http://localhost:5088/api/health

Optional local Mongo:

```bash
docker compose up -d
```

Then use `MONGODB_URI=mongodb://127.0.0.1:27017/biryani2broccoli`.

## Deploy (Render + MongoDB Atlas + GitHub)

1. Create a free Atlas cluster, database user, and network access `0.0.0.0/0`. Copy the `mongodb+srv://` URI.
2. Push this repo to GitHub.
3. On Render, create a **Web Service** from the repo (or use `render.yaml`).
   - Build: `npm run build`
   - Start: `npm start`
   - Env: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`
4. After deploy, open the Render URL and create a profile.

Food and exercise catalogs seed automatically on first boot.

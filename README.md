# Aurora Fest — Documentation

Projet complet avec :
- **Backend (Next.js 15 + App Router)**  
- **Prisma + MySQL (Docker)**  
- **NextAuth (Credentials)** avec vérification e-mail, reset password  
- **API Docs (Swagger)**  
- **Frontend mobile (Expo)**  

---

## 1) Prérequis

- Node.js ≥ 18  
- Docker + Docker Compose  
- Git  
- Un compte Mailtrap (pour les e-mails de test)

---

## 2) Cloner le repo

```bash
git clone <votre-repo> mon-festival
cd mon-festival
````

Deux dossiers :

```
mon-festival/
  next/     # Backend + Front Next.js
  mobile/   # App mobile Expo
  README.md
  .gitignore
```

---

## 3) Backend (Next.js)

### Installation des dépendances

```bash
cd next
npm install
```

### Fichier `.env`

Créez `next/.env` :

```env
# Base de données
DATABASE_URL="mysql://app:app@localhost:3306/festival"
SHADOW_DATABASE_URL="mysql://root:root@localhost:3306/festival_shadow"

# NextAuth
NEXTAUTH_SECRET="change_me"
NEXTAUTH_URL="http://localhost:3000"

# SMTP (Mailtrap)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<mailtrap_user>
SMTP_PASS=<mailtrap_pass>
MAIL_FROM="Aurora Fest <no-reply@aurorafest.dev>"

# URL publique du front (liens e-mails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4) Base de données (Docker MySQL)

Fichier `next/docker-compose.yml` :

```yaml
services:
  db:
    image: mysql:8
    container_name: festival_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: festival
      MYSQL_USER: app
      MYSQL_PASSWORD: app
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql
volumes:
  db_data:
```

Démarrer MySQL :

```bash
cd next
docker compose up -d
```

Vérifier :

```bash
docker ps
docker logs -f festival_db
```

Shell MySQL :

```bash
docker exec -it festival_db mysql -uroot -proot
```

---

## 5) Prisma

### Générer client + migrations

```bash
npx prisma generate
npx prisma migrate dev -n init
```

⚠️ Si erreur `P3014` → créer manuellement la shadow DB :

```bash
docker exec -it festival_db mysql -uroot -proot \
  -e "CREATE DATABASE IF NOT EXISTS festival_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Puis relancer :

```bash
npx prisma migrate dev -n init
```

### Seed

Exécuter les données de démo :

```bash
# seed via Prisma
npx prisma db seed

# exécution manuelle
node prisma/seed.js

# reset complet + reseed
npx prisma migrate reset
```

### Prisma Studio

Explorer la base :

```bash
npx prisma studio
```

---

## 6) Lancer Next.js

### Dev

```bash
npm run dev
```

Accessible : [http://localhost:3000](http://localhost:3000)

### Prod

⚠️ Génère aussi la doc API avant le build.

```bash
npm run build   # équivaut à: npm run docs:gen && next build
npm run start
```

---

## 7) API Docs (Swagger)

### Générer la spec

```bash
npm run docs:gen
```

→ Produit `public/openapi.json`.

### Consulter

* JSON brut : [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)
* UI Swagger : [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 8) Mobile (Expo)

### Installation

```bash
cd ../mobile
npm install
```

### Config `WEB_URL`

Dans `mobile/app/index.tsx`, la variable :

```ts
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "http://172.16.0.188:3000";
```

⚠️ Remplacer l’IP par **celle affichée dans `npm run dev` du projet Next** (ou par `http://localhost:3000` si vous êtes sur le même appareil).

---

### Lancer Expo

```bash
npm run start
```

Scanner le QR code dans Expo Go.

---

## 9) Authentification

* **Inscription** : `/register` → mail (Mailtrap) avec lien de vérification.
* **Connexion** : `/login` (seulement si `email_verifie = true`).
* **Mot de passe oublié** : `/forgot` → envoi d’un lien `/reset`.
* **Reset** : `/reset` → nouveau mot de passe → update en BDD.

---

## 10) Commandes utiles

Backend (`next/`) :

```bash
npm run dev            # dev
npm run build          # build prod (inclut doc API)
npm run start          # start prod
npm run prisma:studio  # ouvrir Prisma Studio
npm run prisma:seed    # seed manuelle
npx prisma migrate reset   # reset + reseed
```

Mobile (`mobile/`) :

```bash
npm run start          # lancer Expo
```

Docker :

```bash
docker compose up -d   # démarrer DB
docker compose down    # arrêter
docker compose down -v # reset total
docker logs -f festival_db
```

---

## 11) Notes & bonnes pratiques

* Lors de l’utilisation du **mobile**, adaptez toujours `WEB_URL` à l’adresse affichée par Next (`npm run dev`).
* Si dans les e-mails les liens contiennent une IP inaccessible, remplacez par `http://localhost:3000`.
* Pensez à sécuriser `.env` et secrets en prod.
* Pour la prod : configurer un vrai SMTP (Brevo, Mailgun, etc.) et un vrai domaine pour `NEXTAUTH_URL` et `NEXT_PUBLIC_APP_URL`.

---

## 12) Licence

Projet pédagogique Aurora Fest — librement réutilisable et améliorable.

Projet mené par Dayana Keo et Melvin Delorme
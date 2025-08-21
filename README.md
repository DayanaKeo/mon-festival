# Aurora Fest — README

Un projet **Next.js 15** (App Router) full-stack avec **Prisma/MySQL**, **NextAuth (Credentials)**, inscriptions avec **vérification par e-mail (token hashé)**, **forgot/reset password**, back+front dans **un seul projet**, et **Docker** pour la base.

---

## 1) Prérequis

* Node.js ≥ 18
* Docker & Docker Compose
* Un compte **Mailtrap** (sandbox SMTP)
* Git

---

## 2) Cloner et installer

```bash
git clone <votre-repo> mon-festival
cd mon-festival
npm i
```

---

## 3) Fichier `.env`

Créez un fichier `.env` à la racine (adapter si besoin) :

```env
# Base de données
DATABASE_URL="mysql://app:app@localhost:3306/festival"
SHADOW_DATABASE_URL="mysql://root:root@localhost:3306/festival_shadow"

# NextAuth
NEXTAUTH_SECRET="Jl63UUwPmSSaScztu8X3s963xb5lc2Mjq3UweSUx4t8="
NEXTAUTH_URL="http://localhost:3000"

# SMTP (Mailtrap)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=<votre_user_mailtrap>
SMTP_PASS=<votre_pass_mailtrap>
MAIL_FROM="Aurora Fest <no-reply@aurorafest.dev>"

# URL publique du front (pour les liens dans les e-mails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# si vous testez depuis un téléphone sur le réseau local :
# NEXT_PUBLIC_APP_URL=http://<IP_locale_de_votre_machine>:3000
```

> `NEXT_PUBLIC_APP_URL` doit être **atteignable par l’appareil** qui clique sur le lien dans l’e-mail.

---

## 4) Démarrer MySQL avec Docker

Un `docker-compose.yml` (résumé) :

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

Lancer :

```bash
docker compose up -d
```

Vérifier :

```bash
docker ps
docker logs -f festival_db
```

> Besoin d’un shell MySQL dans le conteneur :
>
> ```bash
> docker exec -it festival_db mysql -uroot -proot
> ```

---

## 5) Prisma : migrations + client

Générer le client puis appliquer les migrations :

```bash
npx prisma generate
npx prisma migrate dev -n init
```

### Si vous voyez une erreur **P3014 / shadow database**

Créez manuellement la BDD shadow :

```bash
docker exec -it festival_db mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS festival_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Relancez la migration :

```bash
npx prisma migrate dev -n init
```

### Seed (données de démo)

Si le script existe dans le projet :

```bash
npm run prisma:seed
```

---

## 6) Lancer le serveur Next.js (dev)

```bash
npm run dev
```

* Front/Back/API : [http://localhost:3000](http://localhost:3000)
* API Prisma : via `/app/api/*`

---

## 7) Authentification & e-mails

### Inscription

1. Page `/register`
2. Envoi d’un e-mail via **Mailtrap** avec un **token** (hashé en BDD, expiration 24h).
3. Le clic ouvre `/verify?token=...` → validation côté serveur → redirection auto vers `/login?verified=1`.

### Connexion

* Page `/login` (Credentials, via **NextAuth**)
* Auth autorisée uniquement si `email_verifie = true`.

### Mot de passe oublié / reset

* `/forgot` → envoie un lien `/reset?token=...` (token hashé, expiration 1h)
* `/reset` → poste le nouveau mot de passe → met à jour `mot_de_passe_hash`.

---

## 8) Rôles / Admin (option)

Vous pouvez promouvoir un utilisateur en SQL (exemple) :

```bash
docker exec -it festival_db mysql -uroot -proot \
  -e "UPDATE festival.Utilisateur SET role='ADMIN' WHERE email='votre@mail.com';"
```

---

## 9) Arborescence (résumé)

```
app/
  api/
    auth/[...nextauth]/route.ts     # NextAuth
    register/route.ts               # inscription + mail
    verify/route.ts                 # vérif email (token)
    forgot/route.ts                 # demande reset
    reset/route.ts                  # applique reset
  login/page.tsx                    # connexion
  register/page.tsx                 # inscription
  verify/page.tsx                   # page de confirmation
  forgot/page.tsx                   # envoi lien reset
  reset/page.tsx                    # nouveau mot de passe
lib/
  prisma.ts                         # client Prisma
  mailer.ts                         # transport Mailtrap + templates
  tokens.ts                         # tokens vérif e-mail (hash + expire)
  resetTokens.ts                    # tokens reset (hash + expire)
prisma/
  schema.prisma                     # schéma (Utilisateur, VerificationToken, PasswordResetToken…)
  migrations/                       # migrations générées
public/
  videos/festival.mp4               # vidéo de fond
```

---

## 10) Scripts utiles

Dans `package.json` (exemples recommandés) :

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "node prisma/seed.js"
  }
}
```

Studio Prisma (UI DB) :

```bash
npx prisma studio
```

---

## 11) Docker : commandes pratiques

* Démarrer : `docker compose up -d`
* Arrêter : `docker compose down`
* Arrêter et supprimer volume DB (reset total) :
  `docker compose down -v`
* Logs DB : `docker logs -f festival_db`
* Shell MySQL :
  `docker exec -it festival_db mysql -uroot -proot`

---

## 12) Build / Production (simple)

Build :

```bash
npm run build
```

Démarrer en prod :

```bash
npm run start
```

> En prod, pensez à :
>
> * un vrai domaine pour `NEXTAUTH_URL` et `NEXT_PUBLIC_APP_URL`
> * un SMTP de prod (Brevo, Mailgun, etc.)
> * des secrets `.env` sécurisés

---

## 13) Dépannage rapide

* **P3014 / Shadow DB** → créez `festival_shadow` (cf. §5)
* **P1003 / DB introuvable** → MySQL pas up ou mauvais `DATABASE_URL`
* **E-mails non reçus** → vérifiez Mailtrap (Inbox SMTP), `SMTP_*` et `MAIL_FROM`
* **Liens d’e-mail n’ouvrent pas le site** → `NEXT_PUBLIC_APP_URL` doit être atteignable (localhost vs IP locale)
* **“Cannot resolve bcrypt”** → utilisez `bcryptjs` côté Node (déjà câblé)
* **401 sur login** → compte non vérifié ou mauvais mot de passe

---

## 14) Sécurité (déjà intégré)

* Tokens e-mail et reset **opaques** et **hashés** (SHA-256) stockés en BDD, avec **expiration** et **usage unique**.
* Credentials sécurisés via `bcryptjs`.
* Aucune fuite d’info sur `/forgot` (réponse toujours OK).

---

## 15) Crédit / Licence

Projet pédagogique “festival” — librement réutilisable pour vos TP/démos.
Améliorations bienvenues (PR, issues) ✌️
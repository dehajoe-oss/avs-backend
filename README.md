# 🚀 Backend Agro Véto Services Congo (A.V.S.)

Backend API REST complet développé en **Node.js**, **Express**, **PostgreSQL** et **Prisma ORM**, spécialement conçu pour être déployé sur **Render** (ou tout hébergeur cloud compatible).

---

## 📋 Sommaire

- [Fonctionnalités](#-fonctionnalités)
- [Architecture du projet](#-architecture-du-projet)
- [Endpoints de l'API REST](#-endpoints-de-lapi-rest)
- [Installation et démarrage en local](#-installation-et-démarrage-en-local)
- [Déploiement sur Render](#-déploiement-sur-render)
- [Commandes Prisma utiles](#-commandes-prisma-utiles)

---

## ✨ Fonctionnalités

1. **Authentification & Rôles** : Inscription, connexion avec tokens JWT sécurisés, hashage bcrypt, rôles `ADMIN`, `STAFF` et `CLIENT`.
2. **Catalogue & Boutique** : Produits agropastoraux réels AVS (Poussins Cobb 500, Provende, Désinfectants, Abreuvoirs...), catégories, gestion des stocks et promotions.
3. **Commandes & Ventes** : Passage de commandes, calcul sécurisé des totaux, numéros de commande uniques (`AVS-YYYY-XXXX`), suivi de livraison.
4. **Leads & Devis** : Collecte des prospects agropastoraux, algorithme de scoring de lead automatique et suivi commercial.
5. **Clinique Vétérinaire & Visites** : Prise de rendez-vous en cabinet 24/7 et demandes de visites d'élevage dans le Kouilou.
6. **Ferme-École & Formations** : Inscriptions aux sessions pratiques certifiantes (Élevage avicole, hygiène HACCP, saponification).
7. **Factures & Comptabilité** : Émission et gestion de factures professionnelles avec TVA et remises.
8. **Assistant IA & Chatbot** : Enregistrement et historique des sessions de discussion.
9. **Analytics & KPIs** : Statistiques complètes pour le tableau de bord (chiffre d'affaires, commandes, leads, visites).
10. **Health Check Render** : Endpoint `/api/health` testant le serveur et la connexion active à PostgreSQL.

---

## 📂 Architecture du projet

```text
backend/
├── render.yaml               # Déploiement automatique en 1 clic sur Render (Blueprint)
├── package.json              # Dépendances et scripts de démarrage
├── .env.example              # Modèle de configuration des variables d'environnement
├── prisma/
│   ├── schema.prisma         # Modélisation PostgreSQL complète
│   └── seed.js               # Données initiales (Admin, Catalogue AVS, Catégories)
└── src/
    ├── server.js             # Serveur HTTP avec écoute 0.0.0.0 et graceful shutdown
    ├── app.js                # Configuration Express (CORS, Helmet, Rate-limit, Routes)
    ├── config/env.js         # Chargement centralisé des variables d'environnement
    ├── lib/prisma.js         # Singleton PrismaClient
    ├── middlewares/          # Authentification JWT, rôles, gestionnaire d'erreurs
    ├── controllers/          # Logique métier pour chaque module
    └── routes/               # Routes HTTP REST
```

---

## 📡 Endpoints de l'API REST

### 🩺 Santé & Monitoring
- `GET /api/health` : État du serveur et test de la connexion PostgreSQL (utilisé par Render).

### 🔐 Authentification
- `POST /api/auth/register` : Création de compte client.
- `POST /api/auth/login` : Connexion et obtention du token JWT.
- `GET /api/auth/me` : Profil de l'utilisateur connecté *(Token requis)*.
- `PUT /api/auth/profile` : Mise à jour du profil *(Token requis)*.
- `PUT /api/auth/password` : Changement de mot de passe *(Token requis)*.
- `GET /api/auth/users` : Liste de tous les utilisateurs *(Admin uniquement)*.

### 🛍️ Produits & Catégories
- `GET /api/products` : Liste des produits (filtres par catégorie, recherche, pagination).
- `GET /api/products/categories` : Liste des catégories.
- `GET /api/products/:slug` : Détail d'un produit par son slug.
- `POST /api/products` : Créer un produit *(Admin / Staff)*.
- `PUT /api/products/:id` : Modifier un produit *(Admin / Staff)*.
- `DELETE /api/products/:id` : Supprimer un produit *(Admin / Staff)*.

### 📦 Commandes
- `POST /api/orders` : Passer une commande (public ou connecté).
- `GET /api/orders/my-orders` : Commandes du client connecté *(Token requis)*.
- `GET /api/orders/track/:orderNumber` : Suivi public par numéro de commande.
- `GET /api/orders` : Toutes les commandes *(Admin / Staff)*.
- `PATCH /api/orders/:id/status` : Mettre à jour le statut de livraison / paiement *(Admin / Staff)*.

### 🎯 Prospects & Devis (Leads)
- `POST /api/leads` : Soumettre un besoin agropastoral (avec scoring automatique).
- `GET /api/leads` : Liste des prospects triés par score *(Admin / Staff)*.
- `PATCH /api/leads/:id/status` : Mettre à jour le statut commercial *(Admin / Staff)*.

### 🐾 Clinique Vétérinaire
- `POST /api/appointments` : Demander un RDV clinique ou une visite en ferme.
- `GET /api/appointments` : Liste des rendez-vous *(Admin / Staff)*.
- `PATCH /api/appointments/:id/status` : Confirmer ou clore un rendez-vous *(Admin / Staff)*.

### 🎓 Formations Ferme-École
- `POST /api/formations` : S'inscrire à une formation pratique.
- `GET /api/formations` : Inscriptions reçues *(Admin / Staff)*.
- `PATCH /api/formations/:id/status` : Mettre à jour le statut d'une inscription *(Admin / Staff)*.

### 🧾 Facturation
- `POST /api/invoices` : Créer une facture avec calcul automatique *(Admin / Staff)*.
- `GET /api/invoices` : Liste des factures *(Admin / Staff)*.
- `GET /api/invoices/:id` : Détail d'une facture *(Admin / Staff)*.
- `PATCH /api/invoices/:id/status` : Mettre à jour le statut de paiement *(Admin / Staff)*.

### 💳 Paiements (KKiaPay & Mobile Money Congo)
- `POST /api/payments/kkiapay/verify` : Valider une transaction KKiaPay et passer la commande en `PAID`.
- `POST /api/payments/kkiapay/webhook` : Webhook de notification instantanée KKiaPay.
- `POST /api/payments/momo/initiate` : Initier une demande de paiement Mobile Money (Airtel Money ou MTN MoMo Congo).

### 📬 Contact & Devis Express
- `POST /api/contact` : Soumission du formulaire de contact avec calcul automatique du score de prospect.

### 🖼️ Médias & Téléversement
- `POST /api/uploads/image` : Téléversement et optimisation d'image sur Cloudinary (ou fallback local).

### 📊 Statistiques & Dashboard
- `GET /api/stats/dashboard` : KPIs consolidés (ventes, commandes, leads qualifiés, visites) *(Admin / Staff)*.
- `POST /api/stats/track` : Enregistrement des pages vues depuis le frontend.

---

## 💻 Installation et démarrage en local

### 1. Installer les dépendances
```bash
cd backend
npm install
```

### 2. Configurer le fichier d'environnement
Créez un fichier `.env` à la racine de `backend/` :
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:votre_mot_de_passe@localhost:5432/avs_db?schema=public"
JWT_SECRET="votre_cle_secrete_jwt"
FRONTEND_URL="http://localhost:3000"
ADMIN_EMAIL="admin@agrovetoservices.cg"
ADMIN_PASSWORD="Admin@Avs2026!"
```

### 3. Initialiser la base de données PostgreSQL
```bash
# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate

# Insérer les données initiales (Admin, Catalogue AVS)
npm run prisma:seed
```

### 4. Démarrer le serveur en développement
```bash
npm run dev
```
Le serveur démarrera sur **`http://localhost:5000`**.

---

## ☁️ Déploiement sur Render

### Méthode 1 : Déploiement Automatique via Blueprint (Recommandé)

Le fichier [`render.yaml`](file:///home/joe/akatech-agencenext/backend/render.yaml) est déjà configuré à la racine du backend.

1. Connectez-vous sur [Render.com](https://render.com).
2. Cliquez sur **New +** puis sélectionnez **Blueprint**.
3. Choisissez votre dépôt GitHub (`johaoooo/avs`).
4. Render va automatiquement détecter `render.yaml` et créer :
   - Une base de données **PostgreSQL** (`avs-postgres`) gratuite.
   - Le **Web Service Node.js** (`avs-backend`).
   - Lier automatiquement la variable `DATABASE_URL`.
5. Cliquez sur **Apply** : Render installe les dépendances, génère Prisma, déploie les migrations et exécute le seed automatiquement !

---

### Méthode 2 : Déploiement Manuel sur Render

Si vous préférez créer les services manuellement :

#### Étape A : Créer la base PostgreSQL
1. Sur Render, cliquez sur **New +** > **PostgreSQL**.
2. Nom : `avs-postgres`.
3. Région : `Frankfurt` (ou Oregon).
4. Cliquez sur **Create Database**.
5. Une fois créée, copiez la valeur de **Internal Database URL** (ou External si hébergé hors Render).

#### Étape B : Créer le Web Service Node.js
1. Cliquez sur **New +** > **Web Service**.
2. Connectez votre dépôt GitHub.
3. Renseignez les paramètres suivants :
   - **Name** : `avs-backend`
   - **Region** : Même région que la base (ex: `Frankfurt`)
   - **Root Directory** : `backend`
   - **Runtime** : `Node`
   - **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy && node prisma/seed.js`
   - **Start Command** : `npm start`
4. Dans la section **Environment Variables**, ajoutez :
   - `DATABASE_URL` : Collez l'URL de votre base PostgreSQL Render
   - `NODE_ENV` : `production`
   - `JWT_SECRET` : Cliquez sur *Generate* ou saisissez une chaîne aléatoire sécurisée
   - `FRONTEND_URL` : URL de votre site frontend (ex: `https://agrovetoservices.cg`)
   - `ADMIN_EMAIL` : `admin@agrovetoservices.cg`
   - `ADMIN_PASSWORD` : Mot de passe de votre choix pour l'administrateur
5. Cliquez sur **Create Web Service**.
6. Dès la fin du build, votre backend sera accessible sur votre URL Render (ex: `https://avs-backend.onrender.com`).

---

## 🛠️ Commandes Prisma utiles

- **Ouvrir l'interface graphique de la base de données (Prisma Studio)** :
  ```bash
  npm run prisma:studio
  ```
  *(Ouvre `http://localhost:5555` dans votre navigateur pour visualiser toutes vos tables et enregistrements)*.

- **Re-générer le client Prisma après modification du schéma** :
  ```bash
  npm run prisma:generate
  ```

- **Créer une nouvelle migration après modification de `schema.prisma`** :
  ```bash
  npm run prisma:migrate
  ```

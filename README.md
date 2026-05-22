# 🐄 Vachtag

**Vachtag** est un outil de gestion de bétail destiné à un agriculteur, à utiliser sur smartphone directement sur le terrain. Application web mobile-first, propulsée par Firebase (Auth + Firestore), pensée pour une utilisation à une seule main.

---

## ✨ Fonctionnalités

- 🔐 **Connexion sécurisée** par compte Google, avec liste blanche d'e-mail.
- 📊 **Tableau de bord** temps réel : total du bétail, bêtes en traitement.
- ➕ **Enregistrement** d'une nouvelle bête (numéro de boucle, nom, naissance, état).
- 📋 **Liste & recherche éclair** par nom ou numéro de boucle, calcul d'âge automatique.
- 🚨 **Badge sanitaire** « Vente interdite » sur les bêtes en traitement.

---

## 🛠 Stack technique

- HTML5 / CSS3 / JavaScript Vanilla (ES Modules natifs, aucun framework)
- Tailwind CSS via CDN + `style.css` complémentaire
- Firebase Web SDK v10 (Auth Google + Cloud Firestore)
- Single Page Application, mobile-first, largeur max 480 px sur desktop

---

## 📁 Structure du projet

```
vachtag/
├── index.html              → structure HTML, conteneurs des vues
├── style.css               → styles personnalisés (animations, composants)
├── js/
│   ├── firebase-config.js  → configuration Firebase + initialisation
│   ├── auth.js             → authentification Google + contrôle d'accès
│   ├── firestore.js        → CRUD et lecture temps réel sur Firestore
│   ├── views.js            → navigation SPA entre vues
│   ├── utils.js            → utilitaires (âge, toasts, spinner, échappement)
│   └── app.js              → point d'entrée et orchestration
├── firestore.rules         → règles de sécurité Firestore
└── README.md               → ce fichier
```

---

## 🚀 Configuration pas à pas

### 1. Créer un projet Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com/).
2. Clique sur **« Ajouter un projet »**, donne-lui un nom (ex. `vachtag`), suis les étapes.

### 2. Activer l'authentification Google

1. Dans le projet, ouvre **Authentication → Sign-in method**.
2. Active le fournisseur **Google**, renseigne l'e-mail de support, puis **Enregistre**.

### 3. Créer la base Firestore

1. Ouvre **Firestore Database → Créer une base de données**.
2. Choisis le mode **production** (les règles seront fournies à l'étape 5).
3. Sélectionne la région (ex. `eur3` pour l'Europe).

### 4. Récupérer la configuration Web

1. Ouvre **Paramètres du projet → Général**.
2. Tout en bas, dans **« Tes applications »**, ajoute une application **Web</>** (icône `</>`).
3. Donne-lui un surnom (ex. `vachtag-web`), inutile d'activer Firebase Hosting pour l'instant.
4. Copie l'objet `firebaseConfig` affiché.

Ouvre `js/firebase-config.js` et remplace le bloc indiqué par `← REMPLACER PAR TES CLÉS FIREBASE` :

```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "vachtag-xxx.firebaseapp.com",
  projectId:         "vachtag-xxx",
  storageBucket:     "vachtag-xxx.appspot.com",
  messagingSenderId: "1234567890",
  appId:             "1:1234567890:web:abcdef",
};
```

> 💡 Les clés Firebase Web sont **publiques par nature**. La sécurité est assurée par les règles Firestore (étape 5) et la liste blanche d'e-mail (étape 6).

### 5. Déployer les règles de sécurité Firestore

1. Ouvre `firestore.rules` et remplace l'adresse `agriculteur@gmail.com` par **ton e-mail Google** (celui qui doit avoir accès).
2. Dans la console Firebase, va dans **Firestore Database → Règles**.
3. Colle l'intégralité du contenu de `firestore.rules`.
4. Clique sur **Publier**.

> Ces règles refusent **toute** lecture/écriture à un utilisateur dont l'e-mail ne correspond pas exactement à celui autorisé. C'est la vraie couche de sécurité.

### 6. Définir l'e-mail autorisé côté client

Ouvre `js/auth.js` et modifie la constante en haut de fichier :

```js
const EMAIL_AUTORISE = "agriculteur@gmail.com"; // ← MODIFIER ICI
```

Mets-y **la même adresse** que celle des règles Firestore. Cette vérification améliore l'expérience utilisateur (refus immédiat avec message clair) mais ne remplace pas les règles côté serveur.

### 7. Autoriser le domaine d'hébergement

Dans **Authentication → Settings → Domaines autorisés**, ajoute le domaine sur lequel l'application sera servie (ex. `mon-pseudo.github.io`). `localhost` et `*.firebaseapp.com` sont déjà autorisés par défaut.

---

## 🖥 Lancer en local

Comme l'application utilise des modules ES natifs, elle **doit être servie via HTTP** (pas en `file://`). Au plus simple :

```bash
# avec Python 3
python3 -m http.server 8000

# ou avec Node
npx serve .
```

Puis ouvre [http://localhost:8000](http://localhost:8000).

---

## 🌐 Déployer sur GitHub Pages

1. Crée un dépôt GitHub (public ou privé) et pousse le code.
2. Dans **Settings → Pages**, sélectionne la branche `main` (ou `gh-pages`) et la racine `/`.
3. Récupère l'URL publique (ex. `https://mon-pseudo.github.io/vachtag/`).
4. Ajoute ce domaine dans **Firebase → Authentication → Settings → Domaines autorisés**.

---

## 🔒 Modèle de sécurité (résumé)

| Couche | Rôle | Fichier |
|---|---|---|
| **Serveur** | Refus de toute requête dont l'e-mail authentifié ≠ e-mail autorisé. **Vraie protection.** | `firestore.rules` |
| **Client** | Déconnexion immédiate + message clair si l'e-mail n'est pas autorisé. **Confort utilisateur.** | `js/auth.js` |

Les clés Firebase publiées sur GitHub ne posent **aucun risque** tant que les règles Firestore sont correctement déployées.

---

## 📐 Modèle de données

Collection Firestore **`betail`** — un document par animal :

| Champ           | Type        | Description                         |
|-----------------|-------------|-------------------------------------|
| `numeroBoucle`  | `string`    | Identifiant unique (obligatoire)    |
| `nom`           | `string`    | Surnom (facultatif)                 |
| `dateNaissance` | `string`    | Date ISO `yyyy-mm-dd` (facultatif)  |
| `etatSante`     | `string`    | `'Sain'` ou `'En traitement'`       |
| `dateCreation`  | `Timestamp` | Horodatage serveur                  |

---

## 📄 Licence

Outil privé — usage personnel.

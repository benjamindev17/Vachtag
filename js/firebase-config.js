/**
 * firebase-config.js
 * -------------------------------------------------------------
 * Initialisation du SDK Firebase Web v10 (imports modulaires
 * directement depuis les CDN officiels gstatic).
 *
 * ⚠️ Les clés ci-dessous sont publiques par nature côté client.
 *    La sécurité réelle est assurée par les règles Firestore
 *    (voir firestore.rules) et par la vérification de l'e-mail
 *    autorisé côté client (voir auth.js).
 * -------------------------------------------------------------
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

// =============================================================
// ← REMPLACER PAR TES CLÉS FIREBASE
// Récupère-les dans la console Firebase :
//   Paramètres du projet → Général → Tes applications → Web → Config
// =============================================================
const firebaseConfig = {
  apiKey:            "REMPLACER_PAR_TA_API_KEY",
  authDomain:        "REMPLACER_PAR_TON_AUTH_DOMAIN",      // ex. "vachtag-xxx.firebaseapp.com"
  projectId:         "REMPLACER_PAR_TON_PROJECT_ID",       // ex. "vachtag-xxx"
  storageBucket:     "REMPLACER_PAR_TON_STORAGE_BUCKET",   // ex. "vachtag-xxx.appspot.com"
  messagingSenderId: "REMPLACER_PAR_TON_SENDER_ID",
  appId:             "REMPLACER_PAR_TON_APP_ID",
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// Instances réutilisables dans toute l'application
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Fournisseur Google (Auth)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
// Configuration Firebase du projet « vachtag-93bb1 »
// Récupérée dans : Paramètres du projet → Général → Application Web
// =============================================================
const firebaseConfig = {
  apiKey:            "AIzaSyB53kWTYYS1-Jn01_WXmK8Gcqwk3hzZKWw",
  authDomain:        "vachtag-93bb1.firebaseapp.com",
  projectId:         "vachtag-93bb1",
  storageBucket:     "vachtag-93bb1.firebasestorage.app",
  messagingSenderId: "219957085809",
  appId:             "1:219957085809:web:7cf3cc5fe1027f4f39fdd0",
  measurementId:     "G-ZCW2D0X0JT",
};

// Initialisation de l'application Firebase
const app = initializeApp(firebaseConfig);

// Instances réutilisables dans toute l'application
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Fournisseur Google (Auth)
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

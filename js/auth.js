/**
 * auth.js
 * -------------------------------------------------------------
 * Gestion de l'authentification Google + contrôle d'accès
 * par e-mail autorisé.
 *
 * NB : cette vérification côté client améliore uniquement
 *      l'expérience utilisateur. La sécurité réelle est
 *      assurée par firestore.rules.
 * -------------------------------------------------------------
 */

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

import { auth, googleProvider } from './firebase-config.js';

// =============================================================
// ← MODIFIER ICI : seul cet e-mail aura accès à l'application
// =============================================================
const EMAIL_AUTORISE = "agriculteur@gmail.com";

/**
 * Vérifie si l'utilisateur Google connecté est autorisé.
 * Comparaison insensible à la casse.
 *
 * @param {import('firebase/auth').User|null} user
 * @returns {boolean}
 */
export function estUtilisateurAutorise(user) {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === EMAIL_AUTORISE.trim().toLowerCase();
}

/**
 * Lance la connexion Google via popup.
 * Si l'utilisateur n'est pas autorisé, il est immédiatement
 * déconnecté et une erreur explicite est renvoyée.
 *
 * @returns {Promise<import('firebase/auth').User>}
 * @throws  {Error} 'ACCES_NON_AUTORISE' si e-mail non autorisé
 */
export async function connecterAvecGoogle() {
  const resultat = await signInWithPopup(auth, googleProvider);
  const user = resultat.user;

  if (!estUtilisateurAutorise(user)) {
    // L'utilisateur n'est pas autorisé : on le déconnecte aussitôt
    await signOut(auth);
    const err = new Error('ACCES_NON_AUTORISE');
    err.code = 'ACCES_NON_AUTORISE';
    throw err;
  }

  return user;
}

/**
 * Déconnecte l'utilisateur courant.
 */
export async function deconnecter() {
  await signOut(auth);
}

/**
 * Écouteur central sur l'état d'authentification.
 * Le callback reçoit :
 *   - l'utilisateur Firebase s'il est connecté ET autorisé
 *   - null sinon (déconnecté ou rejeté)
 *
 * @param {(user: import('firebase/auth').User|null) => void} callback
 * @returns {() => void} fonction de désabonnement
 */
export function ecouterAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user && !estUtilisateurAutorise(user)) {
      // Sécurité supplémentaire : si l'utilisateur revient sur le site
      // alors qu'il était resté connecté avec un compte non autorisé,
      // on le déconnecte immédiatement.
      try { await signOut(auth); } catch (_) { /* silencieux */ }
      callback(null);
      return;
    }
    callback(user || null);
  });
}

export { EMAIL_AUTORISE };

/**
 * firestore.js
 * -------------------------------------------------------------
 * Opérations CRUD et écoute temps réel sur la collection
 * Firestore « betail ».
 *
 * Modèle d'un document « betail » :
 *   {
 *     numeroBoucle:  string  (identifiant unique)
 *     nom:           string  (facultatif)
 *     dateNaissance: string  (ISO yyyy-mm-dd, facultatif)
 *     etatSante:     'Sain' | 'En traitement'
 *     dateCreation:  Timestamp (serveur)
 *   }
 * -------------------------------------------------------------
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

import { db } from './firebase-config.js';

// Référence stable à la collection
const collectionBetail = collection(db, 'betail');

/**
 * Vérifie si un numéro de boucle est déjà présent en base.
 * @param {string} numeroBoucle
 * @returns {Promise<boolean>}
 */
export async function numeroBoucleExiste(numeroBoucle) {
  const q = query(collectionBetail, where('numeroBoucle', '==', numeroBoucle));
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * Ajoute une bête à la collection Firestore.
 *
 * @param {{
 *   numeroBoucle:  string,
 *   nom?:          string,
 *   dateNaissance?: string,
 *   etatSante:     'Sain' | 'En traitement'
 * }} donnees
 * @returns {Promise<string>} l'identifiant du document créé
 */
export async function ajouterBete(donnees) {
  const document = {
    numeroBoucle:  donnees.numeroBoucle.trim(),
    nom:           (donnees.nom || '').trim(),
    dateNaissance: donnees.dateNaissance || '',
    etatSante:     donnees.etatSante || 'Sain',
    dateCreation:  serverTimestamp(),
  };
  const ref = await addDoc(collectionBetail, document);
  return ref.id;
}

/**
 * Écoute en temps réel l'intégralité de la collection « betail »,
 * triée par date de création décroissante.
 *
 * @param {(betes: Array<object>) => void} onChange   reçoit le tableau des bêtes
 * @param {(erreur: Error) => void}        [onError]  callback d'erreur
 * @returns {() => void} fonction de désabonnement
 */
export function ecouterBetail(onChange, onError) {
  const q = query(collectionBetail, orderBy('dateCreation', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const betes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onChange(betes);
    },
    (erreur) => {
      console.error('[Firestore] Erreur d\'écoute :', erreur);
      if (typeof onError === 'function') onError(erreur);
    }
  );
}

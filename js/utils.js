/**
 * utils.js
 * -------------------------------------------------------------
 * Fonctions utilitaires : calcul d'âge, formatage,
 * affichage de notifications (toast), gestion du spinner.
 * -------------------------------------------------------------
 */

/**
 * Calcule l'âge exact en années et mois entre une date de
 * naissance et aujourd'hui, et le retourne sous forme lisible.
 *
 * Exemples :
 *   '2 ans et 3 mois'
 *   '1 an'
 *   '7 mois'
 *   'Moins d\'un mois'
 *   'Âge inconnu'   (date absente / invalide / future)
 *
 * @param {string} dateNaissance  date ISO (yyyy-mm-dd)
 * @returns {string}
 */
export function calculerAge(dateNaissance) {
  if (!dateNaissance) return 'Âge inconnu';

  const naissance = new Date(dateNaissance);
  if (isNaN(naissance.getTime())) return 'Âge inconnu';

  const aujourdHui = new Date();
  if (naissance > aujourdHui) return 'Âge inconnu';

  // Calcul des années et mois entiers
  let annees = aujourdHui.getFullYear() - naissance.getFullYear();
  let mois   = aujourdHui.getMonth()    - naissance.getMonth();

  // Ajustement si le jour du mois n'est pas encore atteint
  if (aujourdHui.getDate() < naissance.getDate()) {
    mois -= 1;
  }

  if (mois < 0) {
    annees -= 1;
    mois   += 12;
  }

  // Formatage avec gestion singulier/pluriel
  if (annees === 0 && mois === 0) return "Moins d'un mois";

  const partAnnees = annees > 0
    ? `${annees} ${annees > 1 ? 'ans' : 'an'}`
    : '';
  const partMois = mois > 0
    ? `${mois} mois`
    : '';

  if (annees > 0 && mois > 0) return `${partAnnees} et ${partMois}`;
  return partAnnees || partMois;
}

/**
 * Normalise une chaîne pour la recherche (minuscules, sans accents).
 * @param {string} str
 * @returns {string}
 */
export function normaliser(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // suppression des diacritiques
}

/**
 * Affiche un toast (notification éphémère) en bas de l'écran.
 *
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [duree=2500] en millisecondes
 */
export function afficherToast(message, type = 'info', duree = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('toast-success', 'toast-error', 'hidden');
  if (type === 'success') toast.classList.add('toast-success');
  if (type === 'error')   toast.classList.add('toast-error');

  // Forçage du reflow pour permettre l'animation
  void toast.offsetWidth;
  toast.classList.add('toast-show');

  // Nettoyage d'un précédent timer le cas échéant
  if (afficherToast._timer) clearTimeout(afficherToast._timer);
  afficherToast._timer = setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.classList.add('hidden'), 250);
  }, duree);
}

/**
 * Affiche / masque l'overlay de chargement global.
 * @param {boolean} actif
 */
export function chargementGlobal(actif) {
  const loader = document.getElementById('loader-global');
  if (!loader) return;
  loader.classList.toggle('hidden', !actif);
}

/**
 * Échappe une chaîne pour insertion sûre dans le HTML.
 * @param {string} str
 * @returns {string}
 */
export function echapperHtml(str) {
  return (str ?? '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

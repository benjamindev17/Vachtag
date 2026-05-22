/**
 * views.js
 * -------------------------------------------------------------
 * Navigation Single Page Application : affichage / masquage
 * dynamique des 4 vues (login, dashboard, form, list).
 * -------------------------------------------------------------
 */

// Identifiants des vues disponibles
export const VUES = {
  LOGIN:     'vue-login',
  DASHBOARD: 'vue-dashboard',
  FORM:      'vue-form',
  LIST:      'vue-list',
};

let vueCouranteId = null;

/**
 * Affiche une vue par son ID et masque toutes les autres.
 *
 * @param {string} idVue   l'ID de la vue à afficher
 * @param {(idVue: string) => void} [onChange] callback optionnel
 */
export function afficherVue(idVue, onChange) {
  const sections = document.querySelectorAll('.view');
  sections.forEach((section) => {
    if (section.id === idVue) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  });

  vueCouranteId = idVue;
  if (typeof onChange === 'function') onChange(idVue);

  // Remise en haut de page lors d'un changement de vue
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/**
 * Retourne l'ID de la vue actuellement affichée.
 * @returns {string|null}
 */
export function vueCourante() {
  return vueCouranteId;
}

/**
 * Branche tous les boutons « retour » (.btn-back) afin qu'ils
 * affichent la vue indiquée par leur attribut data-target.
 */
export function brancherBoutonsRetour() {
  document.querySelectorAll('.btn-back').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cible = btn.dataset.target || VUES.DASHBOARD;
      afficherVue(cible);
    });
  });
}

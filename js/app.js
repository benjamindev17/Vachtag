/**
 * app.js
 * -------------------------------------------------------------
 * Point d'entrée de l'application Vachtag.
 * - Orchestre les modules (auth, firestore, vues, utils)
 * - Branche les écouteurs d'événements de l'UI
 * - Synchronise l'état (utilisateur, bétail) en temps réel
 * -------------------------------------------------------------
 */

import {
  connecterAvecGoogle,
  deconnecter,
  ecouterAuth,
} from './auth.js';

import {
  ajouterBete,
  ecouterBetail,
  numeroBoucleExiste,
} from './firestore.js';

import {
  VUES,
  afficherVue,
  brancherBoutonsRetour,
} from './views.js';

import {
  calculerAge,
  normaliser,
  afficherToast,
  chargementGlobal,
  echapperHtml,
} from './utils.js';

// =============================================================
// État applicatif en mémoire
// =============================================================
let betailEnMemoire = [];     // liste complète, alimentée par onSnapshot
let desabonnerBetail = null;  // fonction de désabonnement Firestore
let termeRecherche = '';      // valeur courante de la recherche

// =============================================================
// Sélecteurs raccourcis
// =============================================================
const $ = (id) => document.getElementById(id);

// =============================================================
// 1) Authentification & cycle de vie
// =============================================================

/**
 * Réagit aux changements d'état d'authentification.
 * - utilisateur autorisé  → tableau de bord + écoute Firestore
 * - aucun utilisateur     → écran de connexion + nettoyage
 */
function gererChangementAuth(user) {
  if (user) {
    // Affichage du prénom (ou e-mail si pas de nom)
    const nomAffiche = (user.displayName || user.email || '').split(' ')[0];
    $('user-name').textContent = nomAffiche || 'Agriculteur';

    // Masquage de toute erreur de connexion résiduelle
    $('login-error').classList.add('hidden');

    afficherVue(VUES.DASHBOARD);
    demarrerEcouteBetail();
  } else {
    arreterEcouteBetail();
    betailEnMemoire = [];
    rafraichirIndicateurs();
    afficherVue(VUES.LOGIN);
  }
}

/**
 * Démarre l'écoute temps réel de la collection « betail ».
 */
function demarrerEcouteBetail() {
  // Évite les abonnements multiples
  if (desabonnerBetail) return;

  desabonnerBetail = ecouterBetail(
    (betes) => {
      betailEnMemoire = betes;
      rafraichirIndicateurs();
      rafraichirListe();
    },
    (erreur) => {
      console.error(erreur);
      afficherToast('Erreur de connexion à la base.', 'error');
    }
  );
}

/**
 * Arrête l'écoute temps réel (à la déconnexion).
 */
function arreterEcouteBetail() {
  if (typeof desabonnerBetail === 'function') {
    desabonnerBetail();
    desabonnerBetail = null;
  }
}

// =============================================================
// 2) Tableau de bord — indicateurs
// =============================================================

function rafraichirIndicateurs() {
  const total      = betailEnMemoire.length;
  const traitement = betailEnMemoire.filter((b) => b.etatSante === 'En traitement').length;
  $('stat-total').textContent      = total;
  $('stat-traitement').textContent = traitement;
}

// =============================================================
// 3) Formulaire d'ajout
// =============================================================

/**
 * Réinitialise le formulaire à son état par défaut.
 */
function reinitialiserFormulaire() {
  const form = $('form-betail');
  form.reset();
  $('input-sante').value = 'Sain';
  majToggleSante('Sain');
  $('form-error').classList.add('hidden');
}

/**
 * Met à jour l'apparence du toggle « état de santé ».
 * @param {string} valeur
 */
function majToggleSante(valeur) {
  document.querySelectorAll('.toggle-sante').forEach((btn) => {
    btn.classList.toggle('toggle-active', btn.dataset.value === valeur);
  });
}

/**
 * Affiche une erreur localisée dans le formulaire.
 * @param {string} message
 */
function afficherErreurForm(message) {
  const el = $('form-error');
  el.textContent = message;
  el.classList.remove('hidden');
}

/**
 * Bascule l'état du bouton submit (chargement on/off).
 */
function chargementSubmit(actif) {
  const btn = $('btn-submit');
  btn.disabled = actif;
  $('btn-submit-label').textContent = actif ? 'Enregistrement…' : 'Enregistrer';
  $('btn-submit-spinner').classList.toggle('hidden', !actif);
}

/**
 * Gère la soumission du formulaire d'ajout d'une bête.
 */
async function gererSoumissionForm(evt) {
  evt.preventDefault();
  $('form-error').classList.add('hidden');

  const numeroBoucle  = $('input-boucle').value.trim();
  const nom           = $('input-nom').value.trim();
  const dateNaissance = $('input-naissance').value;
  const etatSante     = $('input-sante').value || 'Sain';

  // Validation
  if (!numeroBoucle) {
    afficherErreurForm('Le numéro de boucle est obligatoire.');
    $('input-boucle').focus();
    return;
  }

  chargementSubmit(true);
  try {
    // Vérification d'unicité (best-effort, la collection reste petite)
    const existe = await numeroBoucleExiste(numeroBoucle);
    if (existe) {
      afficherErreurForm('Ce numéro de boucle existe déjà.');
      chargementSubmit(false);
      return;
    }

    await ajouterBete({ numeroBoucle, nom, dateNaissance, etatSante });
    afficherToast('Bête enregistrée ✓', 'success');
    reinitialiserFormulaire();
    // Retour au tableau de bord (la mise à jour des stats arrive via onSnapshot)
    afficherVue(VUES.DASHBOARD);
  } catch (erreur) {
    console.error(erreur);
    afficherErreurForm("Impossible d'enregistrer. Vérifie ta connexion.");
  } finally {
    chargementSubmit(false);
  }
}

// =============================================================
// 4) Liste & recherche
// =============================================================

/**
 * Rafraîchit l'affichage de la liste en fonction du terme
 * de recherche courant et du contenu de betailEnMemoire.
 */
function rafraichirListe() {
  const container = $('liste-betail');
  const elVide    = $('liste-vide');
  const elAucun   = $('liste-aucun-resultat');

  // Filtrage selon la recherche (nom OU numéro de boucle)
  const terme = normaliser(termeRecherche);
  const filtrees = terme
    ? betailEnMemoire.filter((b) =>
        normaliser(b.nom).includes(terme) ||
        normaliser(b.numeroBoucle).includes(terme)
      )
    : betailEnMemoire;

  // États vides
  if (betailEnMemoire.length === 0) {
    container.innerHTML = '';
    elVide.classList.remove('hidden');
    elAucun.classList.add('hidden');
    return;
  }
  if (filtrees.length === 0) {
    container.innerHTML = '';
    elVide.classList.add('hidden');
    elAucun.classList.remove('hidden');
    return;
  }

  elVide.classList.add('hidden');
  elAucun.classList.add('hidden');

  // Rendu des cartes
  container.innerHTML = filtrees.map(genererCarte).join('');
}

/**
 * Génère le HTML d'une carte « bête ».
 * @param {object} bete
 * @returns {string} HTML
 */
function genererCarte(bete) {
  const aLeNom = !!(bete.nom && bete.nom.trim());
  const titre  = aLeNom ? echapperHtml(bete.nom) : echapperHtml(bete.numeroBoucle);
  const sousTitre = aLeNom
    ? `<p class="text-sm text-gray-500 mt-0.5">N° ${echapperHtml(bete.numeroBoucle)}</p>`
    : '';

  const age = echapperHtml(calculerAge(bete.dateNaissance));

  const badge = bete.etatSante === 'En traitement'
    ? `<span class="badge badge-traitement">⚠️ Vente interdite</span>`
    : `<span class="badge badge-sain">Sain</span>`;

  return `
    <article class="carte-betail">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="text-xl font-bold text-gray-900 truncate">${titre}</h3>
          ${sousTitre}
          <p class="text-sm text-gray-600 mt-2">
            <span aria-hidden="true">🎂</span> ${age}
          </p>
        </div>
        <div class="shrink-0">${badge}</div>
      </div>
    </article>
  `;
}

// =============================================================
// 5) Branchements UI
// =============================================================

function brancherEcouteurs() {
  // ---- Login ----
  $('btn-login').addEventListener('click', async () => {
    $('login-error').classList.add('hidden');
    chargementGlobal(true);
    try {
      await connecterAvecGoogle();
      // gererChangementAuth() fera le reste via ecouterAuth
    } catch (erreur) {
      if (erreur.code === 'ACCES_NON_AUTORISE') {
        $('login-error').textContent = "Accès non autorisé. Cet e-mail n'est pas habilité à utiliser Vachtag.";
        $('login-error').classList.remove('hidden');
      } else if (erreur.code === 'auth/popup-closed-by-user' || erreur.code === 'auth/cancelled-popup-request') {
        // L'utilisateur a fermé le popup : on ignore silencieusement
      } else {
        console.error(erreur);
        $('login-error').textContent = 'Erreur de connexion. Réessaie.';
        $('login-error').classList.remove('hidden');
      }
    } finally {
      chargementGlobal(false);
    }
  });

  // ---- Logout ----
  $('btn-logout').addEventListener('click', async () => {
    try {
      await deconnecter();
      afficherToast('Déconnecté', 'info');
    } catch (erreur) {
      console.error(erreur);
      afficherToast('Erreur à la déconnexion', 'error');
    }
  });

  // ---- Navigation depuis le tableau de bord ----
  $('btn-go-form').addEventListener('click', () => {
    reinitialiserFormulaire();
    afficherVue(VUES.FORM);
    setTimeout(() => $('input-boucle').focus(), 150);
  });

  $('btn-go-list').addEventListener('click', () => {
    $('input-recherche').value = '';
    termeRecherche = '';
    rafraichirListe();
    afficherVue(VUES.LIST);
  });

  // ---- Boutons « retour » ----
  brancherBoutonsRetour();

  // ---- Toggle « état de santé » ----
  document.querySelectorAll('.toggle-sante').forEach((btn) => {
    btn.addEventListener('click', () => {
      const valeur = btn.dataset.value;
      $('input-sante').value = valeur;
      majToggleSante(valeur);
    });
  });

  // ---- Formulaire ----
  $('form-betail').addEventListener('submit', gererSoumissionForm);

  // ---- Recherche ----
  $('input-recherche').addEventListener('input', (evt) => {
    termeRecherche = evt.target.value;
    rafraichirListe();
  });
}

// =============================================================
// 6) Démarrage
// =============================================================

function demarrer() {
  brancherEcouteurs();
  // Vue par défaut tant qu'on ne sait rien de l'utilisateur
  afficherVue(VUES.LOGIN);
  // Branche l'écouteur central d'auth
  ecouterAuth(gererChangementAuth);
}

// Lancement quand le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', demarrer);
} else {
  demarrer();
}

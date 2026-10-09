[English](README.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Español](README.es.md) | **Français** | [한국어](README.ko.md) | [Português (BR)](README.pt_BR.md) | [简体中文](README.zh_CN.md)

# AI Window Deck

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

**Plus de sessions cloud. De la place pour réfléchir.**

Gestionnaire de fenêtres pour Claude Code dans le cloud et Codex : menez plusieurs projets de front sans vous y perdre.

Une extension Chrome pour celles et ceux qui travaillent avec plusieurs outils d'IA et références côte à côte. Enregistrez les fenêtres que vous utilisez ensemble, disposez-les sur un canevas, ouvrez-les toutes d'un coup sous forme de fenêtres Chrome en mosaïque et mettez-en une en avant avec un seul raccourci.

Votre profil Chrome, vos connexions, votre gestionnaire de mots de passe et vos autres extensions restent tels quels. AI Window Deck se contente d'organiser des fenêtres Chrome ordinaires.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/focus-preview-en-dark.gif">
    <img src="docs/images/focus-preview-en-light.gif" width="720" alt="Cinq fenêtres en mosaïque. Alt+X en agrandit une ; un nouvel appui la remet à sa place.">
  </picture>
</p>

Site web: <https://ai-window-deck.vercel.app/>

## Comment ça marche

| **① Enregistrer les URL** | **② Disposition** |
| --- | --- |
| <img src="site/assets/img/01-step1-urls.png" alt="① Enregistrer les URL" width="400"> | <img src="site/assets/img/02-step2-layout.png" alt="② Disposition" width="400"> |
| Enregistrez un nom et des URL pour chaque fenêtre, ou collez une liste de sites pour en créer plusieurs à la fois. Chaque URL s'ouvre dans un onglet. | Placez les fenêtres sur le canevas et ajustez leurs cases de la grille. |
| **③ Vue focus** | **④ Lancer** |
| <img src="site/assets/img/03-step3-focus.png" alt="③ Vue focus" width="400"> | <img src="site/assets/img/04-step4-launch.png" alt="④ Lancer" width="400"> |
| Choisissez la taille d'agrandissement et l'origine : sur place ou au centre. | Choisissez vos écrans et ouvrez la disposition enregistrée en fenêtres Chrome. |

### Enregistrer URL + fenêtre (nouveau dans 1.11.2)

*Enregistrer URL + fenêtre* s'ouvre directement dans la page. Ajoutez les fenêtres une par une, ou collez un message qui liste vos sites : chaque bloc séparé par une ligne vide devient une fenêtre. Les lignes à revoir sont marquées en rouge, et **Corriger** ajoute la ligne vide manquante.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/register-paste-en-dark.gif">
    <img src="docs/images/register-paste-en-light.gif" width="480" alt="La carte en bloc : un message de chat qui liste des sites est copié, collé et enregistré en trois fenêtres.">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="site/assets/img/register-bulk-en-dark.png">
    <img src="site/assets/img/register-bulk-en-light.png" width="720" alt="Import en bloc avec deux lignes marquées en rouge et un bouton Corriger pour chaque problème.">
  </picture>
</p>

## Fonctionnalités

- **Enregistrer URL + fenêtre.** Chaque fenêtre enregistrée possède un nom et une ou plusieurs URL, qui s'ouvrent sous forme d'onglets. Ajoutez les fenêtres une par une, ou collez une liste de sites : chaque bloc séparé par une ligne vide devient une fenêtre. Les lignes à revoir sont marquées en rouge, avec un lien vers la ligne et un bouton **Corriger**. Vous pouvez aussi importer et exporter un fichier `.txt`.
- **Adresses et fichiers locaux.** `github.com` est enregistré comme `https://github.com` ; `localhost` et les adresses locales reçoivent `http://`. Les chemins locaux comme `/Users/me/My Site/index.html` ou `C:\docs\notes.html` s'ouvrent en onglets `file://` dès que *Autoriser l'accès aux URL de fichier* est activé pour l'extension. Plusieurs URL sur une ligne deviennent chacune un onglet.
- **Canevas de disposition.** Faites glisser des fenêtres sur un canevas de 12 × 12 et redimensionnez-les depuis n'importe quel bord. Les dispositions disponibles sont Auto, Vertical, Horizontal, Grille, Focus (une grande fenêtre) et Libre. Le canevas permet d'annuler et de rétablir, et vous pouvez conserver plusieurs préréglages de disposition (A, B, …).
- **Ouverture et réorganisation.** Un clic ouvre toutes les fenêtres de la disposition et les place en mosaïque sur le ou les écrans choisis, avec leurs onglets regroupés. *Réorganiser* remet à leur place les fenêtres déjà ouvertes.
- **Spotlight.** `Alt+X` agrandit la fenêtre active : moitié, en hauteur, trois quarts, pleine hauteur, plein écran ou taille personnalisée. Vous choisissez si elle s'agrandit depuis sa position actuelle ou depuis le centre de l'écran. Appuyez de nouveau sur `Alt+X`, ou sur `Alt+Z`, pour la remettre dans sa vignette.
- **Navigation entre les fenêtres.** Passez à la fenêtre précédente ou suivante, affichez la fenêtre 1 à 8, annulez la dernière organisation et basculez en plein écran.
- **Plusieurs écrans.** Choisissez le ou les moniteurs sur lesquels le deck s'ouvre.
- **Contrôleur flottant et grande fenêtre.** Gardez un contrôleur compact ouvert, ou ouvrez les paramètres dans une fenêtre dédiée.
- **Sauvegarde.** Sauvegardez ou restaurez toutes les fenêtres, dispositions et réglages sous forme de fichier JSON.
- **8 langues.** English, 日本語, Deutsch, Español, Français, 한국어, Português (Brasil) et 简体中文. Le panneau suit la langue du navigateur jusqu'à ce que vous en choisissiez une.

<p align="center"><img src="site/assets/img/05-focus-enlarge.png" width="720" alt="Agrandissement comparé : sur place à gauche, au centre à droite"></p>
<p align="center"><em>Sur place / Au centre — choisissez l'origine à l'étape ③.</em></p>

## Installation

### Chrome Web Store

Installez-la depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc).

### À partir d'un ZIP de version

1. Téléchargez `ai-window-deck-vX.Y.Z.zip` depuis [Releases](https://github.com/takaoumehara/ai-window-deck/releases) et décompressez-le.
2. Ouvrez `chrome://extensions` et activez le **Mode développeur**.
3. Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier décompressé.

### À partir des sources

```sh
git clone https://github.com/takaoumehara/ai-window-deck.git
```

La racine du dépôt est le paquet de l'extension 1.11.2 lui-même : il n'y a rien à installer ni à compiler. Chargez le dossier cloné (celui qui contient `manifest.json`) avec **Charger l'extension non empaquetée**.

## Utilisation

1. Cliquez sur l'icône de la barre d'outils. Au premier lancement, un court guide indique les trois étapes.
2. **Choisissez un écran** sous *Choisir le ou les écrans cibles*.
3. **Enregistrez des fenêtres** avec **Enregistrer URL + fenêtre** : choisissez *Une par une* (un nom, ainsi qu'une ou plusieurs URL) ou *En bloc (coller du texte)*.
4. **Faites glisser les fenêtres sur le canevas.** Indiquez le nombre de fenêtres souhaité, choisissez une disposition et redimensionnez les vignettes depuis leurs bords.
5. Cliquez sur **Ouvrir**. Chaque fenêtre s'ouvre dans sa propre fenêtre Chrome, disposée en mosaïque conformément au canevas.
6. Utilisez les raccourcis Spotlight et de navigation pendant votre travail.

Astuces :

- Dans la barre latérale, double-cliquez sur une fiche de fenêtre ou appuyez sur `Enter` pour la modifier. `Delete` la supprime.
- `Escape` ferme le panneau d'enregistrement (depuis un formulaire, il revient d'abord au choix), et le focus clavier revient au bouton qui l'a ouvert.
- *Ouvrir en grande fenêtre* ouvre le même panneau dans un format plus spacieux que la fenêtre contextuelle de la barre d'outils.

### Raccourcis clavier

| Commande | Par défaut |
| --- | --- |
| Spotlight : agrandir la fenêtre active / la remettre dans sa vignette | `Alt+X` |
| Remettre la fenêtre dans sa vignette d'origine | `Alt+Z` |
| Organiser (remettre en mosaïque) les fenêtres du deck | `Alt+A` |
| Plein écran / retour | `Alt+Q` |
| Annuler la dernière organisation | non défini |
| Fenêtre suivante / fenêtre précédente | non défini |
| Afficher la fenêtre 1 à 8 | non défini |

Chrome ne permet à une extension de proposer que quatre raccourcis par défaut. Vous pouvez attribuer ou modifier n'importe lequel d'entre eux sur `chrome://extensions/shortcuts` ; le lien *Modifier les raccourcis* du panneau ouvre cette page. Sous macOS, Chrome affiche `Alt` sous la forme `⌥`.

## Autorisations et confidentialité

| Autorisation | Pourquoi elle est nécessaire |
| --- | --- |
| `tabs` | Ouvrir les URL enregistrées sous forme d'onglets, et lire les titres et URL des fenêtres ouvertes pour les lister et les organiser. |
| `tabGroups` | Nommer et colorer le groupe d'onglets de chaque fenêtre ouverte par le deck. |
| `storage` | Enregistrer vos fenêtres, dispositions et préférences. |
| `system.display` | Lire la taille et la position des écrans afin de placer les fenêtres en mosaïque sur le bon moniteur. |

AI Window Deck ne dispose d'aucune autorisation d'hôte ni d'aucun script de contenu, et ne lit pas le contenu des pages. L'extension n'effectue aucune requête réseau et ne charge aucun code distant. Il n'y a ni outil d'analyse ni compte. Les paramètres sont stockés avec `chrome.storage.sync`, ce qui permet à Chrome de les synchroniser entre vos propres appareils si la synchronisation Chrome est activée. L'état temporaire servant à l'annulation est conservé dans `chrome.storage.session`. Rien n'est envoyé au développeur ni à des tiers.

La politique complète se trouve dans [PRIVACY.md](PRIVACY.md).

## Développement

Nécessite Node.js 20+ (et Python 3 avec Pillow pour les visuels du store).

```sh
npm test              # node --test
npm run package       # zip + validate ai-window-deck-v<version>.zip
```

Les sources de 1.11.x ne sont pas dans ce dépôt. La racine contient le paquet 1.11.2 tel qu'il est publié. Son bundle `dist/` est régénéré à partir du paquet 1.11.0 publié sur le store par des remplacements de texte exacts et testés. Avec le paquet 1.11.0 décompressé, les tests vérifient aussi que le patch reproduit la racine octet pour octet :

```sh
npm run patch -- <unpacked-1.11.0> <out>    # tools/patch-v1.11.2-inline-register.mjs
AWD_V1110_DIR=<unpacked-1.11.0> npm test
```

Organisation du dépôt :

| Chemin | Contenu |
| --- | --- |
| `manifest.json`, `background.js`, `identify.*`, `icons/`, `_locales/`, `dist/` | Le paquet de l'extension 1.11.2, exactement celui envoyé sur le Chrome Web Store |
| `tools/` | Scripts de patch (`patch-v1.11*.mjs`, avec leurs textes et leur code dans `v1.11.1/`, `v1.11.2/`), empaquetage, validation du paquet, envoi sur le Chrome Web Store |
| `site/` | Le site web, déployé par Vercel (voir `vercel.json`) |
| `store-assets/` | Textes, captures d'écran, visuels promotionnels et scripts de capture pour le Chrome Web Store |
| `test/` | Tests unitaires |
| `legacy/v1.7/` | Les sources antérieures à 1.11 (le panneau React de 1.7 et les anciennes pages), conservées pour référence. Voir leur README |

## Processus de publication

1. Augmentez `version` dans `package.json` et dans l'étape du manifeste du script de patch, et mettez à jour `CHANGELOG.md`.
2. Lancez `npm test` et `npm run package`. Le validateur vérifie les fichiers référencés, les clés `__MSG_` dans chaque langue et la longueur de la description.
3. Importez le ZIP dans le tableau de bord du Chrome Web Store.
4. Une fois la version approuvée, créez le tag `vX.Y.Z` sur `main` et joignez le ZIP à une GitHub Release.

Voir [docs/RELEASING.md](docs/RELEASING.md) pour les détails.

## Assistance

Signalez les bugs et suggestions sur [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues).

Si AI Window Deck vous aide au quotidien, vous pouvez soutenir son développement sur [Ko-fi](https://ko-fi.com/G2G71VP1DF).

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

## Licence

[MIT](LICENSE) © 2026 Takao Umehara

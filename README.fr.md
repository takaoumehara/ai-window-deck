[English](README.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Español](README.es.md) | **Français** | [한국어](README.ko.md) | [Português (BR)](README.pt_BR.md) | [简体中文](README.zh_CN.md)

# AI Window Deck

Gestionnaire de fenêtres pour Claude Code dans le cloud et Codex : menez plusieurs projets de front sans vous y perdre.

Une extension Chrome pour celles et ceux qui travaillent avec plusieurs outils d'IA et références côte à côte. Enregistrez les fenêtres que vous utilisez ensemble, disposez-les sur un canevas, ouvrez-les toutes d'un coup sous forme de fenêtres Chrome en mosaïque et mettez-en une en avant avec un seul raccourci.

Votre profil Chrome, vos connexions, votre gestionnaire de mots de passe et vos autres extensions restent tels quels. AI Window Deck se contente d'organiser des fenêtres Chrome ordinaires.

![Disposer des fenêtres sur un canevas](store-assets/screenshots/01-arrange.png)

## Fonctionnalités

- **Bibliothèque de fenêtres.** Chaque fenêtre enregistrée possède un nom et une ou plusieurs URL, qui s'ouvrent sous forme d'onglets. Vous pouvez ajouter les fenêtres une par une, les coller en bloc sous forme de texte, ou importer et exporter un fichier `.txt`.
- **Canevas de disposition.** Faites glisser des fenêtres sur un canevas de 12 × 12 et redimensionnez-les depuis n'importe quel bord. Les dispositions disponibles sont Auto, Vertical, Horizontal, Grille, Focus (une grande fenêtre) et Libre. Le canevas permet d'annuler et de rétablir, et vous pouvez conserver plusieurs préréglages de disposition (A, B, …).
- **Ouverture et réorganisation.** Un clic ouvre toutes les fenêtres de la disposition et les place en mosaïque sur le ou les écrans choisis, avec leurs onglets regroupés. *Réorganiser* remet à leur place les fenêtres déjà ouvertes.
- **Spotlight.** `Alt+X` agrandit la fenêtre active : moitié, en hauteur, trois quarts, pleine hauteur, plein écran ou taille personnalisée. Vous choisissez si elle s'agrandit depuis sa position actuelle ou depuis le centre de l'écran. Appuyez de nouveau sur `Alt+X`, ou sur `Alt+Z`, pour la remettre dans sa vignette.
- **Navigation entre les fenêtres.** Passez à la fenêtre précédente ou suivante, affichez la fenêtre 1 à 8, annulez la dernière organisation et basculez en plein écran.
- **Plusieurs écrans.** Choisissez le ou les moniteurs sur lesquels le deck s'ouvre.
- **Contrôleur flottant et grande fenêtre.** Gardez un contrôleur compact ouvert, ou ouvrez les paramètres dans une fenêtre dédiée.
- **Sauvegarde.** Sauvegardez ou restaurez toutes les fenêtres, dispositions et réglages sous forme de fichier JSON.
- **8 langues.** English, 日本語, Deutsch, Español, Français, 한국어, Português (Brasil) et 简体中文. Le panneau suit la langue du navigateur jusqu'à ce que vous en choisissiez une.

| Spotlight | Bibliothèque de fenêtres | Enregistrer des fenêtres |
| --- | --- | --- |
| ![Spotlight](store-assets/screenshots/02-spotlight.png) | ![Bibliothèque de fenêtres](store-assets/screenshots/03-window-library.png) | ![Enregistrer](store-assets/screenshots/04-register.png) |

## Installation

### Chrome Web Store

Installez l'extension depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc).

### À partir d'un ZIP de version

1. Téléchargez `AI-Window-Deck-vX.Y.Z.zip` depuis [Releases](https://github.com/takaoumehara/ai-window-deck/releases) et décompressez-le.
2. Ouvrez `chrome://extensions` et activez le **Mode développeur**.
3. Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier décompressé.

### À partir des sources

```sh
git clone https://github.com/takaoumehara/ai-window-deck.git
cd ai-window-deck
npm install
npm run build
```

Chargez ensuite le dossier du dépôt (celui qui contient `manifest.json`) avec **Charger l'extension non empaquetée**. `dist/` est versionné : un clone récent peut donc aussi être chargé sans compilation.

## Utilisation

1. Cliquez sur l'icône de la barre d'outils. Au premier lancement, un court guide indique les trois étapes.
2. **Choisissez un écran** sous *Choisir le ou les écrans cibles*.
3. **Enregistrez des fenêtres** avec **+** dans la barre latérale *Fenêtres* : un nom, ainsi qu'une ou plusieurs URL.
4. **Faites glisser les fenêtres sur le canevas.** Indiquez le nombre de fenêtres souhaité, choisissez une disposition et redimensionnez les vignettes depuis leurs bords.
5. Cliquez sur **Ouvrir**. Chaque fenêtre s'ouvre dans sa propre fenêtre Chrome, disposée en mosaïque conformément au canevas.
6. Utilisez les raccourcis Spotlight et de navigation pendant votre travail.

Astuces :

- Dans la barre latérale, double-cliquez sur une fiche de fenêtre ou appuyez sur `Enter` pour la modifier. `Delete` la supprime.
- Les boîtes de dialogue se ferment avec `Escape`, et le focus clavier revient au bouton qui les a ouvertes.
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

Nécessite Node.js 20+ et Python 3.

```sh
npm install           # dependencies
npm run build         # build the React panel into dist/
npm test              # unit tests (node --test)
npm run dev           # Vite dev server for the panel (no chrome.* APIs)
./tools/package.sh    # build, validate and zip AI-Window-Deck-v<version>.zip
```

Organisation du dépôt :

| Chemin | Contenu |
| --- | --- |
| `manifest.json`, `background.js` | Manifeste de l'extension et service worker (placement des fenêtres, raccourcis) |
| `src/` | Panneau React + Tailwind utilisé par la fenêtre contextuelle et la page d'options |
| `dist/` | Panneau compilé. Il est versionné afin que le dépôt puisse être chargé tel quel comme extension non empaquetée |
| `identify.html`, `identify.js` | Le numéro brièvement affiché sur un écran lorsque vous l'identifiez |
| `_locales/`, `tools/strings.json`, `tools/ui-strings.json` | Traductions (voir ci-dessous) |
| `tools/` | Build i18n, empaquetage, validation du paquet |
| `store-assets/` | Textes de la fiche Chrome Web Store, captures d'écran, vignettes promotionnelles et script de capture |
| `test/` | Tests unitaires |

`deck.html`, `deck.js`, `dock.html` et `dock.js` constituent le panneau antérieur à la version 1.7. Ils sont conservés à titre de référence et ne sont pas inclus dans le paquet.

### Traductions

Les textes du panneau se trouvent dans `tools/ui-strings.json`. Les textes propres à Chrome (description de l'extension et noms des raccourcis) se trouvent dans `tools/strings.json`. Après avoir modifié l'un de ces fichiers, exécutez :

```sh
python3 tools/build-i18n.py
```

Cette commande régénère `src/lib/ui-strings.js` et `_locales/*/messages.json`. Le build échoue s'il manque une clé dans une langue du panneau. `npm test` vérifie également que les espaces réservés correspondent dans chaque langue.

## Processus de publication

1. Incrémentez `version` dans `manifest.json` et `package.json`, et mettez à jour `CHANGELOG.md`.
2. Exécutez `npm test` et `./tools/package.sh`. Le script valide le ZIP : fichiers référencés, clés `__MSG_` dans chaque langue et longueur de la description.
3. Importez le ZIP dans le tableau de bord du Chrome Web Store.
4. Une fois la version approuvée par le Store, créez le tag `vX.Y.Z` sur `main` et joignez le ZIP à une GitHub Release.

Consultez [docs/RELEASING.md](docs/RELEASING.md) pour plus de détails.

## Assistance

Signalez les bugs et suggestions sur [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues).

## Licence

[MIT](LICENSE) © 2026 Takao Umehara

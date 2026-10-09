[English](README.md) | [日本語](README.ja.md) | **Deutsch** | [Español](README.es.md) | [Français](README.fr.md) | [한국어](README.ko.md) | [Português (BR)](README.pt_BR.md) | [简体中文](README.zh_CN.md)

# AI Window Deck

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

**Mehr Cloud-Sitzungen. Raum zum Denken.**

Fenstermanager für Claude Code in der Cloud und Codex: Arbeiten Sie an mehreren Projekten gleichzeitig, ohne den Überblick zu verlieren.

Eine Chrome-Erweiterung für alle, die mit mehreren KI-Tools und Referenzen nebeneinander arbeiten. Speichern Sie die Fenster, die Sie gemeinsam nutzen, ordnen Sie sie auf einer Arbeitsfläche an, öffnen Sie alle auf einmal als gekachelte Chrome-Fenster und heben Sie eines davon mit einer einzigen Tastenkombination hervor.

Ihr Chrome-Profil, Ihre Anmeldungen, Ihr Passwortmanager und Ihre anderen Erweiterungen bleiben unverändert. AI Window Deck ordnet lediglich gewöhnliche Chrome-Fenster an.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/focus-preview-en-dark.gif">
    <img src="docs/images/focus-preview-en-light.gif" width="720" alt="Fünf gekachelte Fenster. Alt+X vergrößert eines; erneutes Drücken setzt es zurück in seine Kachel.">
  </picture>
</p>

Website: <https://ai-window-deck.vercel.app/>

## So funktioniert es

| **① URLs registrieren** | **② Layout** |
| --- | --- |
| <img src="site/assets/img/01-step1-urls.png" alt="① URLs registrieren" width="400"> | <img src="site/assets/img/02-step2-layout.png" alt="② Layout" width="400"> |
| Speichern Sie für jedes Fenster einen Namen und URLs. Jede URL öffnet sich als Tab. | Platzieren Sie Fenster auf der Arbeitsfläche und passen Sie ihre Rasterfelder an. |
| **③ Fokusansicht** | **④ Starten** |
| <img src="site/assets/img/03-step3-focus.png" alt="③ Fokusansicht" width="400"> | <img src="site/assets/img/04-step4-launch.png" alt="④ Starten" width="400"> |
| Wählen Sie Vergrößerung und Ausgangspunkt: an Ort und Stelle wachsen oder zentrieren. | Wählen Sie Ihre Bildschirme und öffnen Sie das gespeicherte Layout als Chrome-Fenster. |

## Funktionen

- **Fensterbibliothek.** Jedes gespeicherte Fenster hat einen Namen und eine oder mehrere URLs, die als Tabs geöffnet werden. Sie können Fenster einzeln hinzufügen, gesammelt als Text einfügen oder eine `.txt`-Datei importieren und exportieren.
- **Layout-Arbeitsfläche.** Ziehen Sie Fenster auf eine 12 × 12 große Arbeitsfläche und ändern Sie ihre Größe an jeder Kante. Zur Auswahl stehen die Layouts Automatisch, Vertikal, Horizontal, Raster, Fokus (ein großes Fenster) und Frei. Die Arbeitsfläche unterstützt Rückgängig und Wiederholen, und Sie können mehrere Layout-Vorlagen (A, B, …) anlegen.
- **Öffnen und neu anordnen.** Ein Klick öffnet alle Fenster des Layouts und kachelt sie auf dem oder den ausgewählten Bildschirmen, wobei die Tabs jedes Fensters gruppiert werden. *Neu anordnen* bringt bereits geöffnete Fenster wieder an ihren Platz.
- **Spotlight.** `Alt+X` vergrößert das aktive Fenster: auf die Hälfte, hochkant, drei Viertel, volle Höhe, Vollbild oder eine benutzerdefinierte Größe. Sie legen fest, ob es von seiner aktuellen Position oder von der Bildschirmmitte aus wächst. Drücken Sie erneut `Alt+X` oder `Alt+Z`, um es wieder in seine Kachel zurückzusetzen.
- **Zwischen Fenstern wechseln.** Wechseln Sie zum vorherigen oder nächsten Fenster, holen Sie Fenster 1–8 in den Vordergrund, machen Sie die letzte Anordnung rückgängig und schalten Sie den Vollbildmodus ein oder aus.
- **Mehrere Bildschirme.** Wählen Sie, auf welchem Monitor oder welchen Monitoren das Deck geöffnet wird.
- **Schwebende Steuerung und großes Fenster.** Lassen Sie eine kompakte Steuerung geöffnet oder öffnen Sie die Einstellungen in einem eigenen Fenster.
- **Sicherung.** Sichern Sie alle Fenster, Layouts und Einstellungen als JSON-Datei oder stellen Sie sie daraus wieder her.
- **8 Sprachen.** English, 日本語, Deutsch, Español, Français, 한국어, Português (Brasil) und 简体中文. Das Panel folgt der Browsersprache, bis Sie eine Sprache auswählen.

<p align="center"><img src="site/assets/img/05-focus-enlarge.png" width="720" alt="Fokus-Vergrößerung im Vergleich: links an Ort und Stelle, rechts zentriert"></p>
<p align="center"><em>An Ort und Stelle wachsen / Zentrieren — den Ausgangspunkt wählen Sie in Schritt ③.</em></p>

## Installation

### Chrome Web Store

Installieren Sie die Erweiterung aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc).

### Aus einem Release-ZIP

1. Laden Sie `AI-Window-Deck-vX.Y.Z.zip` unter [Releases](https://github.com/takaoumehara/ai-window-deck/releases) herunter und entpacken Sie die Datei.
2. Öffnen Sie `chrome://extensions` und aktivieren Sie den **Entwicklermodus**.
3. Klicken Sie auf **Entpackte Erweiterung laden** und wählen Sie den entpackten Ordner aus.

### Aus dem Quellcode

```sh
git clone https://github.com/takaoumehara/ai-window-deck.git
cd ai-window-deck
npm install
npm run build
```

Laden Sie anschließend den Repository-Ordner (den Ordner, der `manifest.json` enthält) über **Entpackte Erweiterung laden**. `dist/` ist eingecheckt, daher lässt sich ein frischer Klon auch ohne Build laden.

## Verwendung

1. Klicken Sie auf das Symbol in der Symbolleiste. Beim ersten Start markiert eine kurze Anleitung die drei Schritte.
2. **Wählen Sie einen Bildschirm** unter *Ziel-Bildschirm(e) auswählen*.
3. **Registrieren Sie Fenster** mit **+** in der Seitenleiste *Fenster*: einen Namen sowie eine oder mehrere URLs.
4. **Ziehen Sie Fenster auf die Arbeitsfläche.** Legen Sie die gewünschte Anzahl an Fenstern fest, wählen Sie ein Layout und ändern Sie die Größe der Kacheln an ihren Kanten.
5. Klicken Sie auf **Öffnen**. Jedes Fenster wird in einem eigenen Chrome-Fenster geöffnet und entsprechend der Arbeitsfläche gekachelt.
6. Nutzen Sie während der Arbeit die Tastenkombinationen für Spotlight und Navigation.

Tipps:

- Doppelklicken Sie in der Seitenleiste auf eine Fensterkarte oder drücken Sie darauf `Enter`, um sie zu bearbeiten. `Delete` entfernt sie.
- Dialoge werden mit `Escape` geschlossen, und der Tastaturfokus kehrt zu der Schaltfläche zurück, die sie geöffnet hat.
- *In großem Fenster öffnen* öffnet dasselbe Panel in einer geräumigeren Größe als das Popup der Symbolleiste.

### Tastenkombinationen

| Befehl | Standard |
| --- | --- |
| Spotlight: aktives Fenster vergrößern / zurück in seine Kachel | `Alt+X` |
| Fenster in die ursprüngliche Kachel zurücksetzen | `Alt+Z` |
| Deck-Fenster anordnen (neu kacheln) | `Alt+A` |
| Vollbild / zurück | `Alt+Q` |
| Letzte Anordnung rückgängig machen | nicht festgelegt |
| Nächstes Fenster / vorheriges Fenster | nicht festgelegt |
| Fenster 1–8 in den Vordergrund holen | nicht festgelegt |

Chrome erlaubt einer Erweiterung, nur vier Standard-Tastenkombinationen vorzuschlagen. Unter `chrome://extensions/shortcuts` können Sie jede davon zuweisen oder ändern; der Link *Tastenkombinationen ändern* im Panel öffnet diese Seite. Unter macOS zeigt Chrome `Alt` als `⌥` an.

## Berechtigungen und Datenschutz

| Berechtigung | Warum sie benötigt wird |
| --- | --- |
| `tabs` | Gespeicherte URLs als Tabs öffnen sowie Titel und URLs geöffneter Fenster lesen, um sie aufzulisten und anzuordnen. |
| `tabGroups` | Die Tabgruppe jedes vom Deck geöffneten Fensters benennen und einfärben. |
| `storage` | Ihre Fenster, Layouts und Einstellungen speichern. |
| `system.display` | Größe und Position der Bildschirme lesen, damit Fenster auf dem richtigen Monitor gekachelt werden. |

AI Window Deck hat keine Host-Berechtigungen und keine Content-Scripts und liest keine Seiteninhalte. Die Erweiterung stellt keine Netzwerkanfragen und lädt keinen Remote-Code. Es gibt weder Analysen noch Konten. Einstellungen werden mit `chrome.storage.sync` gespeichert, sodass Chrome sie zwischen Ihren eigenen Geräten synchronisieren kann, wenn Chrome Sync aktiviert ist. Der temporäre Zustand für Rückgängig wird in `chrome.storage.session` gehalten. Es werden keine Daten an den Entwickler oder an Dritte gesendet.

Die vollständige Richtlinie finden Sie in [PRIVACY.md](PRIVACY.md).

## Entwicklung

Erfordert Node.js 20+ und Python 3.

```sh
npm install           # dependencies
npm run build         # build the React panel into dist/
npm test              # unit tests (node --test)
npm run dev           # Vite dev server for the panel (no chrome.* APIs)
./tools/package.sh    # build, validate and zip AI-Window-Deck-v<version>.zip
```

Aufbau des Repositorys:

| Pfad | Inhalt |
| --- | --- |
| `manifest.json`, `background.js` | Manifest der Erweiterung und Service Worker (Fensterplatzierung, Tastenkombinationen) |
| `src/` | React- + Tailwind-Panel, das vom Popup und von der Optionsseite verwendet wird |
| `dist/` | Gebautes Panel. Es ist eingecheckt, damit sich das Repository unverändert als entpackte Erweiterung laden lässt |
| `identify.html`, `identify.js` | Die Nummer, die beim Identifizieren eines Bildschirms kurz darauf angezeigt wird |
| `_locales/`, `tools/strings.json`, `tools/ui-strings.json` | Übersetzungen (siehe unten) |
| `tools/` | i18n-Build, Paketierung, Paketvalidierung |
| `store-assets/` | Texte für den Chrome Web Store-Eintrag, Screenshots, Werbekacheln und Aufnahmeskript |
| `test/` | Unit-Tests |

`deck.html`, `deck.js`, `dock.html` und `dock.js` sind das Panel aus der Zeit vor 1.7. Sie werden als Referenz aufbewahrt und nicht mit ausgeliefert.

### Übersetzungen

Die Texte des Panels befinden sich in `tools/ui-strings.json`. Die Texte von Chrome selbst (Beschreibung der Erweiterung und Namen der Tastenkombinationen) befinden sich in `tools/strings.json`. Führen Sie nach dem Bearbeiten einer der beiden Dateien Folgendes aus:

```sh
python3 tools/build-i18n.py
```

Dadurch werden `src/lib/ui-strings.js` und `_locales/*/messages.json` neu erzeugt. Der Build schlägt fehl, wenn in einer Sprache des Panels ein Schlüssel fehlt. `npm test` prüft außerdem, dass die Platzhalter in jeder Sprache übereinstimmen.

## Release-Prozess

1. Erhöhen Sie `version` in `manifest.json` und `package.json` und aktualisieren Sie `CHANGELOG.md`.
2. Führen Sie `npm test` und `./tools/package.sh` aus. Das Skript validiert das ZIP: referenzierte Dateien, `__MSG_`-Schlüssel in jeder Sprache und die Länge der Beschreibung.
3. Laden Sie das ZIP im Chrome Web Store-Dashboard hoch.
4. Nachdem der Store die Version freigegeben hat, setzen Sie das Tag `vX.Y.Z` auf `main` und hängen Sie das ZIP an ein GitHub-Release an.

Einzelheiten finden Sie in [docs/RELEASING.md](docs/RELEASING.md).

## Support

Melden Sie Fehler und Vorschläge über [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues).

Wenn Ihnen AI Window Deck im Alltag hilft, können Sie die Entwicklung auf [Ko-fi](https://ko-fi.com/G2G71VP1DF) unterstützen.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

## Lizenz

[MIT](LICENSE) © 2026 Takao Umehara

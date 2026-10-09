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
| Speichern Sie für jedes Fenster einen Namen und URLs, oder fügen Sie eine Liste von Websites ein, um mehrere auf einmal anzulegen. Jede URL öffnet sich als Tab. | Platzieren Sie Fenster auf der Arbeitsfläche und passen Sie ihre Rasterfelder an. |
| **③ Fokusansicht** | **④ Starten** |
| <img src="site/assets/img/03-step3-focus.png" alt="③ Fokusansicht" width="400"> | <img src="site/assets/img/04-step4-launch.png" alt="④ Starten" width="400"> |
| Wählen Sie Vergrößerung und Ausgangspunkt: an Ort und Stelle wachsen oder zentrieren. | Wählen Sie Ihre Bildschirme und öffnen Sie das gespeicherte Layout als Chrome-Fenster. |

### URLs + Fenster registrieren (neu in 1.11.2)

*URLs + Fenster registrieren* öffnet sich direkt auf der Seite. Fügen Sie Fenster einzeln hinzu oder fügen Sie eine Nachricht mit Ihren Websites ein: Jeder durch eine Leerzeile getrennte Block wird zu einem Fenster. Zeilen, die Aufmerksamkeit brauchen, werden rot markiert, und **Korrigieren** fügt die fehlende Leerzeile ein.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/register-paste-en-dark.gif">
    <img src="docs/images/register-paste-en-light.gif" width="480" alt="Die Karte für das gesammelte Einfügen: Eine Chat-Nachricht mit Websites wird kopiert, eingefügt und als drei Fenster gespeichert.">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="site/assets/img/register-bulk-en-dark.png">
    <img src="site/assets/img/register-bulk-en-light.png" width="720" alt="Gesammelter Import mit zwei rot markierten Zeilen und einer Schaltfläche Korrigieren für jedes Problem.">
  </picture>
</p>

## Funktionen

- **URLs + Fenster registrieren.** Jedes gespeicherte Fenster hat einen Namen und eine oder mehrere URLs, die als Tabs geöffnet werden. Fügen Sie Fenster einzeln hinzu oder fügen Sie eine Liste von Websites ein: Jeder durch eine Leerzeile getrennte Block wird zu einem Fenster. Zeilen, die Aufmerksamkeit brauchen, werden rot markiert, mit einem Link zur Zeile und der Schaltfläche **Korrigieren**. Sie können auch eine `.txt`-Datei importieren und exportieren.
- **Adressen und lokale Dateien.** `github.com` wird als `https://github.com` gespeichert; `localhost` und lokale Adressen erhalten `http://`. Lokale Pfade wie `/Users/me/My Site/index.html` oder `C:\docs\notes.html` öffnen sich als `file://`-Tabs, sobald *Zugriff auf Datei-URLs zulassen* für die Erweiterung aktiviert ist. Mehrere URLs in einer Zeile werden jeweils zu einem Tab.
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
```

Das Stammverzeichnis des Repositorys ist das 1.11.2-Erweiterungspaket selbst, es muss also nichts installiert oder gebaut werden. Laden Sie den geklonten Ordner (den mit `manifest.json`) mit **Entpackte Erweiterung laden**.

## Verwendung

1. Klicken Sie auf das Symbol in der Symbolleiste. Beim ersten Start markiert eine kurze Anleitung die drei Schritte.
2. **Wählen Sie einen Bildschirm** unter *Ziel-Bildschirm(e) auswählen*.
3. **Registrieren Sie Fenster** mit **URLs + Fenster registrieren**: Wählen Sie *Einzeln* (ein Name sowie eine oder mehrere URLs) oder *Gesammelt (Text einfügen)*.
4. **Ziehen Sie Fenster auf die Arbeitsfläche.** Legen Sie die gewünschte Anzahl an Fenstern fest, wählen Sie ein Layout und ändern Sie die Größe der Kacheln an ihren Kanten.
5. Klicken Sie auf **Öffnen**. Jedes Fenster wird in einem eigenen Chrome-Fenster geöffnet und entsprechend der Arbeitsfläche gekachelt.
6. Nutzen Sie während der Arbeit die Tastenkombinationen für Spotlight und Navigation.

Tipps:

- Doppelklicken Sie in der Seitenleiste auf eine Fensterkarte oder drücken Sie darauf `Enter`, um sie zu bearbeiten. `Delete` entfernt sie.
- `Escape` schließt das Registrierungsfeld (aus einem Formular geht es zuerst zur Auswahl zurück), und der Tastaturfokus kehrt zu der Schaltfläche zurück, die es geöffnet hat.
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

Erfordert Node.js 20+ (und Python 3 mit Pillow für die Store-Grafiken).

```sh
npm test              # node --test
npm run package       # zip + validate AI-Window-Deck-v<version>.zip
```

Der Quellcode von 1.11.x ist nicht in diesem Repository. Das Stammverzeichnis enthält das 1.11.2-Paket genau so, wie es ausgeliefert wird. Sein `dist/`-Bundle wird aus dem veröffentlichten 1.11.0-Store-Paket durch exakte, getestete Textersetzungen neu erzeugt. Mit dem entpackten 1.11.0-Paket prüfen die Tests auch, dass der Patch das Stammverzeichnis Byte für Byte reproduziert:

```sh
npm run patch -- <unpacked-1.11.0> <out>    # tools/patch-v1.11.2-inline-register.mjs
AWD_V1110_DIR=<unpacked-1.11.0> npm test
```

Aufbau des Repositorys:

| Pfad | Inhalt |
| --- | --- |
| `manifest.json`, `background.js`, `identify.*`, `icons/`, `_locales/`, `dist/` | Das 1.11.2-Erweiterungspaket, genau so, wie es in den Chrome Web Store hochgeladen wird |
| `tools/` | Patch-Skripte (`patch-v1.11*.mjs`, mit Texten und Code in `v1.11.1/`, `v1.11.2/`), Paketierung, Paketprüfung, Upload in den Chrome Web Store |
| `site/` | Die Website, bereitgestellt von Vercel (siehe `vercel.json`) |
| `store-assets/` | Texte, Screenshots, Werbekacheln und Aufnahmeskripte für den Chrome Web Store |
| `test/` | Unit-Tests |
| `legacy/v1.7/` | Der Quellcode vor 1.11 (das React-Panel von 1.7 und ältere Seiten), zum Nachschlagen aufbewahrt. Siehe dessen README |

## Release-Prozess

1. Erhöhen Sie `version` in `package.json` und im Manifest-Schritt des Patch-Skripts, und aktualisieren Sie `CHANGELOG.md`.
2. Führen Sie `npm test` und `npm run package` aus. Die Prüfung kontrolliert referenzierte Dateien, `__MSG_`-Schlüssel in jedem Gebietsschema und die Länge der Beschreibung.
3. Laden Sie das ZIP im Chrome Web Store-Dashboard hoch.
4. Nachdem der Store die Version freigegeben hat, taggen Sie `vX.Y.Z` auf `main` und hängen Sie das ZIP an ein GitHub-Release an.

Details finden Sie in [docs/RELEASING.md](docs/RELEASING.md).

## Support

Melden Sie Fehler und Vorschläge über [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues).

Wenn Ihnen AI Window Deck im Alltag hilft, können Sie die Entwicklung auf [Ko-fi](https://ko-fi.com/G2G71VP1DF) unterstützen.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

## Lizenz

[MIT](LICENSE) © 2026 Takao Umehara

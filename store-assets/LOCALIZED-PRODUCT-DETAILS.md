# AI Window Deck — localized product details (v1.11.2)

Paste each locale's detailed description into **Product details → Description**, and the new-in-1.11.2 notes into that version's what-is-new field. The product name stays `AI Window Deck` in every locale. The short description comes from `_locales/<lang>/messages.json` (`extDescription`) inside the package. The same text lives in `listing/<locale>/description.txt`.

Category: **Productivity → Workflow & Planning**.

The enlarge command is **Focus view** (日本語: フォーカス表示). The layout preset is **Single large window** (日本語: 大きな1枚). That preset is not Focus view.

---

### English (United States) — `en`

**Item name**

```text
AI Window Deck
```

**Summary / short description** (90/132 characters; this is the manifest `extDescription` and Chrome fills it from the package automatically)

```text
Tile AI workspaces, bring one into focus with a shortcut, and switch between them quickly.
```

**Detailed description** (2786 characters)

```text
AI Window Deck is the window manager for Claude Code in the cloud and Codex. Run multiple projects at once without getting confused: save the sites you use together, lay them out on a canvas, and open them all at once as tiled Chrome windows. Your Chrome profile, sign-ins, password manager and other extensions stay exactly as they are.

Build a deck for Project A, Project B and Project C: research, drafting, review, or any work where Claude Code, Codex and references need to stay visible at the same time. When one window needs your full attention, press Alt+X to enlarge it. Press it again and every window goes back to its tile.

Key features

• Register URLs + Window: add windows right in the page, one by one or in bulk. Paste a message that lists your sites, and each block separated by a blank line becomes a window. Lines that need attention turn red, with a Fix button. You can also import and export a .txt file.
• Smart addresses: type github.com and it is saved as https://github.com (localhost and local addresses get http://). Local files such as /Users/me/My Site/index.html or C:\docs\notes.html open as file:// tabs. Several URLs on one line each become a tab.
• Layout canvas: drag windows onto the canvas and resize them from any edge. Choose Auto, Vertical, Horizontal, Grid, Single large window or Freeform. Undo, redo, and keep several layout presets.
• One-click launch: open every window in the layout, tiled on the display you choose, with its tabs grouped by name. Retile moves launched windows back into place.
• Focus view: Alt+X enlarges the selected window to fill the display, about 80%, half, full height or a custom size, growing in place or centred. Alt+Z puts a window you resized by hand back into its tile.
• Move between windows: previous and next window, focus window 1–8, undo the last arrangement, toggle full screen. Every shortcut can be changed in Chrome.
• Multiple displays: choose which monitor or monitors the deck opens on.
• Floating controller: keep a compact controller open next to your work.
• Backup: back up or restore all windows, layouts and settings as a JSON file.
• 8 languages: English, Japanese, German, Spanish, French, Korean, Brazilian Portuguese and Simplified Chinese.

Privacy

There is no account, server, analytics or remote code. AI Window Deck never reads page content. It reads only window positions and the titles and URLs of open tabs, to list and arrange your windows. Settings are saved in Chrome's extension storage, and Chrome can sync them between your own devices if Chrome Sync is on. Nothing is sent to the developer or to third parties.

Free and open source (MIT). Support development on Ko-fi: https://ko-fi.com/G2G71VP1DF
Source code and support: https://github.com/takaoumehara/ai-window-deck
```

**What's new in 1.11.2**

```text
• "Register URLs + Window" now opens inside the page instead of a dialog. Choose one by one or bulk paste; the bulk card shows a short animation of pasting a list of sites.
• Bulk import marks problem lines in red and lists each issue with a link to its line, a Fix button and "Fix all fixable".
• Addresses without https:// are completed for you; localhost and local addresses get http://.
• Local files work, including paths with spaces, C:\ paths and file:/// URLs.
• Several URLs on one line each become a tab. Lines like "Memo:" stay window names, and a block without a name is called "Window N".
• After a bulk save, choose in the page whether to place the new windows on the canvas automatically.
• The More view links to Ko-fi.
```

**Screenshots:** `listing/en/01-register.png` … `05-launch.png` (1280 × 800). Japanese listing: `listing/ja/`.

---

### 日本語 — Japanese — `ja`

**Item name**

```text
AI Window Deck
```

**Summary / short description** (43/132 characters; this is the manifest `extDescription` and Chrome fills it from the package automatically)

```text
AIの作業ウィンドウを整列し、ショートカットで一つを大きくして、すばやく切り替えます。
```

**Detailed description** (1708 characters)

```text
AI Window Deck は、クラウドの Claude Code と Codex のためのウィンドウマネージャーです。複数のプロジェクトを同時に進めても迷わないよう、一緒に使うサイトを保存してキャンバス上に配置し、タイル状に並んだ Chrome ウィンドウとして一度に開けます。Chrome のプロファイル、ログイン状態、パスワードマネージャー、その他の拡張機能はそのまま使えます。

Project A / B / C のように、リサーチ、下書き、レビューなど、Claude Code・Codex・資料を同時に表示しておきたい作業のためのデッキを作れます。1 つのウィンドウに集中したいときは Alt+X で拡大。もう一度押せば、すべてのウィンドウが元のタイルに戻ります。

主な機能

• URL＋ウィンドウを登録：ページの中で、1件ずつでもまとめてでもウィンドウを登録できます。サイトが並んだメッセージをそのまま貼り付ければ、空行で区切ったまとまりごとにウィンドウができます。直す必要のある行は赤く表示され、修正ボタンで直せます。.txt ファイルのインポート・エクスポートにも対応しています。
• アドレスの自動補完：github.com と入力すれば https://github.com として保存されます（localhost やローカルのアドレスには http://）。/Users/me/My Site/index.html や C:\docs\notes.html のようなローカルファイルも file:// のタブとして開けます。1 行に並んだ複数の URL は、それぞれタブになります。
• レイアウトキャンバス：キャンバスにウィンドウをドラッグし、どの辺からでもサイズを変更できます。レイアウトは自動、縦割り、横割り、グリッド、大きな1枚、自由から選べます。取り消し・やり直しに対応し、複数のレイアウトプリセットを保持できます。
• ワンクリック起動：レイアウト内のすべてのウィンドウを開き、選んだディスプレイにタイル状に並べます。タブは名前ごとにグループにまとめられます。「並べ直す」で、起動済みのウィンドウを元の位置に戻せます。
• フォーカス表示: Alt+X で選んだウィンドウを大きく表示します。画面いっぱい、約 80%、半分、縦いっぱい、任意のサイズから選べ、今の場所から広げるか中央に寄せるかを選べます。手動でサイズを変えたウィンドウも Alt+Z で元のタイルに戻せます。
• ウィンドウ間の移動：前後のウィンドウへの移動、ウィンドウ 1〜8 へのフォーカス、直前の配置の取り消し、全画面の切り替えができます。すべてのショートカットは Chrome で変更できます。
• マルチディスプレイ：デッキを開くモニターを 1 台または複数台から選べます。
• 小窓コントローラー：コンパクトなコントローラーを作業の横に開いておけます。
• バックアップ：すべてのウィンドウ、レイアウト、設定を JSON ファイルでバックアップ・復元できます。
• 8 言語対応：英語、日本語、ドイツ語、スペイン語、フランス語、韓国語、ポルトガル語（ブラジル）、簡体字中国語。

プライバシー

アカウント、サーバー、アナリティクス、リモートコードは一切ありません。AI Window Deck がページの内容を読み取ることはありません。読み取るのは、ウィンドウの一覧表示と配置に必要なウィンドウの位置と、開いているタブのタイトルと URL だけです。設定は Chrome の拡張機能ストレージに保存され、Chrome 同期をオンにしている場合は、Chrome がご自身のデバイス間で同期できます。開発者や第三者に送信されるデータは一切ありません。

無料のオープンソース（MIT）です。Ko-fi で開発を応援できます：https://ko-fi.com/G2G71VP1DF
ソースコードとサポート：https://github.com/takaoumehara/ai-window-deck
```

**1.11.2 の新機能**

```text
• 「URL＋ウィンドウを登録」がダイアログではなくページの中で開くようになりました。1件ずつ登録かテキストで一括登録かを選べ、一括登録のカードではサイトの一覧を貼り付ける様子を短いアニメーションで紹介します。
• 一括登録では、問題のある行を赤く表示し、問題ごとに該当行へのリンク、修正ボタン、「直せるものを全部修正」を表示します。
• https:// のないアドレスは自動で補完します。localhost やローカルのアドレスには http:// が付きます。
• ローカルファイルに対応しました。スペースを含むパス、C:\ のパス、file:/// の URL も使えます。
• 1 行に並んだ複数の URL は、それぞれタブになります。「Memo:」のような行はウィンドウ名のまま、名前のないまとまりは「ウィンドウ N」になります。
• 一括保存のあと、新しいウィンドウをキャンバスに自動配置するかどうかをページの中で選べます。
• 「その他」画面に Ko-fi へのリンクを追加しました。
```

**Screenshots:** `listing/en/01-register.png` … `05-launch.png` (1280 × 800). Japanese listing: `listing/ja/`.

---

### Deutsch — German — `de`

**Item name**

```text
AI Window Deck
```

**Summary / short description** (96/132 characters; this is the manifest `extDescription` and Chrome fills it from the package automatically)

```text
Ordnet KI-Fenster in Kacheln an, vergrößert eins per Kürzel und wechselt schnell zwischen ihnen.
```

**Detailed description** (3368 characters)

```text
AI Window Deck ist der Fenstermanager für Claude Code in der Cloud und Codex. Mehrere Projekte gleichzeitig, ohne den Überblick zu verlieren: Speichern Sie die Websites, die Sie gemeinsam nutzen, ordnen Sie sie auf einer Arbeitsfläche an und öffnen Sie alle auf einmal als gekachelte Chrome-Fenster. Ihr Chrome-Profil, Ihre Anmeldungen, Ihr Passwortmanager und Ihre anderen Erweiterungen bleiben genau so, wie sie sind.

Legen Sie ein Deck für Projekt A, Projekt B und Projekt C an: Recherche, Entwürfe, Überprüfung oder jede Arbeit, bei der Claude Code, Codex und Referenzen gleichzeitig sichtbar bleiben sollen. Wenn ein Fenster Ihre volle Aufmerksamkeit braucht, vergrößern Sie es mit Alt+X. Drücken Sie noch einmal, und jedes Fenster kehrt in seine Kachel zurück.

Wichtigste Funktionen

• URLs + Fenster registrieren: Fenster direkt auf der Seite hinzufügen, einzeln oder gesammelt. Fügen Sie eine Nachricht mit Ihren Websites ein; jeder durch eine Leerzeile getrennte Block wird ein Fenster. Zeilen, die Aufmerksamkeit brauchen, werden rot, mit einer Schaltfläche zum Korrigieren. Sie können auch eine .txt-Datei importieren und exportieren.
• Clevere Adressen: github.com wird als https://github.com gespeichert (localhost und lokale Adressen erhalten http://). Lokale Dateien wie /Users/me/My Site/index.html oder C:\docs\notes.html öffnen sich als file://-Tabs. Mehrere URLs in einer Zeile werden jeweils ein Tab.
• Layout-Arbeitsfläche: Ziehen Sie Fenster auf die Arbeitsfläche und ändern Sie die Größe an jeder Kante. Wählen Sie Automatisch, Vertikal, Horizontal, Raster, Ein großes Fenster oder Frei. Rückgängig, Wiederholen und mehrere Layout-Vorlagen.
• Öffnen mit einem Klick: Öffnen Sie jedes Fenster des Layouts, gekachelt auf dem Bildschirm Ihrer Wahl, mit nach Namen gruppierten Tabs. Neu anordnen setzt gestartete Fenster zurück an ihren Platz.
• Fokusansicht: Alt+X vergrößert das gewählte Fenster auf den ganzen Bildschirm, etwa 80 %, die Hälfte, die volle Höhe oder eine eigene Größe, an Ort und Stelle oder zentriert. Alt+Z setzt ein von Hand geändertes Fenster in seine Kachel zurück.
• Zwischen Fenstern wechseln: vorheriges und nächstes Fenster, Fenster 1–8, letzte Anordnung rückgängig, Vollbild. Jede Tastenkombination lässt sich in Chrome ändern.
• Mehrere Bildschirme: Wählen Sie, auf welchem Monitor oder welchen Monitoren das Deck geöffnet wird.
• Schwebende Steuerung: Lassen Sie eine kompakte Steuerung neben Ihrer Arbeit geöffnet.
• Sicherung: Sichern oder stellen Sie alle Fenster, Layouts und Einstellungen als JSON-Datei wieder her.
• 8 Sprachen: Englisch, Japanisch, Deutsch, Spanisch, Französisch, Koreanisch, brasilianisches Portugiesisch und vereinfachtes Chinesisch.

Datenschutz

Es gibt kein Konto, keinen Server, keine Analysen und keinen Remote-Code. AI Window Deck liest niemals Seiteninhalte. Es liest nur Fensterpositionen sowie Titel und URLs geöffneter Tabs, um Ihre Fenster aufzulisten und anzuordnen. Einstellungen werden im Erweiterungsspeicher von Chrome gespeichert, und Chrome kann sie zwischen Ihren eigenen Geräten synchronisieren, wenn die Chrome-Synchronisierung aktiv ist. Nichts wird an den Entwickler oder an Dritte gesendet.

Kostenlos und Open Source (MIT). Unterstützen Sie die Entwicklung auf Ko-fi: https://ko-fi.com/G2G71VP1DF
Quellcode und Support: https://github.com/takaoumehara/ai-window-deck
```

**Neu in 1.11.2**

```text
• „URLs + Fenster registrieren“ öffnet sich jetzt auf der Seite statt in einem Dialog. Wählen Sie einzeln oder gesammeltes Einfügen; die Karte für das gesammelte Einfügen zeigt eine kurze Animation einer eingefügten Websiteliste.
• Der Sammelimport markiert problematische Zeilen rot und listet jedes Problem mit einem Link zur Zeile, einer Schaltfläche zum Korrigieren und „Alles Korrigierbare korrigieren“.
• Adressen ohne https:// werden ergänzt; localhost und lokale Adressen erhalten http://.
• Lokale Dateien funktionieren, auch Pfade mit Leerzeichen, C:\-Pfade und file:///-URLs.
• Mehrere URLs in einer Zeile werden jeweils ein Tab. Zeilen wie „Memo:“ bleiben Fensternamen, und ein Block ohne Namen heißt „Fenster N“.
• Nach dem gesammelten Speichern wählen Sie auf der Seite, ob die neuen Fenster automatisch auf der Arbeitsfläche platziert werden.
• Die Ansicht „Mehr“ verlinkt auf Ko-fi.
```

**Screenshots:** `listing/en/01-register.png` … `05-launch.png` (1280 × 800). Japanese listing: `listing/ja/`.

---

### Español — Spanish — `es`

**Item name**

```text
AI Window Deck
```

**Summary / short description** (103/132 characters; this is the manifest `extDescription` and Chrome fills it from the package automatically)

```text
Organiza tus ventanas de IA en cuadrícula, amplía una con un atajo y cambia rápidamente entre ventanas.
```

**Detailed description** (3260 characters)

```text
AI Window Deck es el gestor de ventanas para Claude Code en la nube y Codex. Lleva varios proyectos a la vez sin perderte: guarda los sitios que usas juntos, colócalos en un lienzo y ábrelos todos de una vez como ventanas de Chrome en mosaico. Tu perfil de Chrome, tus sesiones iniciadas, tu gestor de contraseñas y tus demás extensiones siguen exactamente como están.

Crea un deck para el Proyecto A, el Proyecto B y el Proyecto C: investigación, redacción, revisión o cualquier trabajo en el que Claude Code, Codex y las referencias deban seguir visibles al mismo tiempo. Cuando una ventana necesite toda tu atención, pulsa Alt+X para ampliarla. Púlsalo otra vez y todas las ventanas vuelven a su mosaico.

Funciones principales

• Registrar URLs + ventana: añade ventanas dentro de la página, de una en una o en lote. Pega un mensaje con tus sitios y cada bloque separado por una línea en blanco se convierte en una ventana. Las líneas que hay que revisar se ponen en rojo, con un botón Corregir. También puedes importar y exportar un archivo .txt.
• Direcciones inteligentes: escribe github.com y se guarda como https://github.com (localhost y las direcciones locales reciben http://). Los archivos locales, como /Users/me/My Site/index.html o C:\docs\notes.html, se abren como pestañas file://. Varias URL en una misma línea se convierten cada una en una pestaña.
• Lienzo de diseño: arrastra ventanas al lienzo y cambia su tamaño desde cualquier borde. Elige Auto, Vertical, Horizontal, Cuadrícula, Una ventana grande o Libre. Deshaz, rehaz y conserva varios diseños predefinidos.
• Apertura con un clic: abre todas las ventanas del diseño, en mosaico en la pantalla que elijas, con las pestañas agrupadas por nombre. Reorganizar devuelve a su sitio las ventanas ya abiertas.
• Vista de enfoque: Alt+X amplía la ventana elegida a toda la pantalla, a un 80 % aproximadamente, a la mitad, a todo el alto o a un tamaño personalizado, desde donde está o centrada. Alt+Z devuelve a su mosaico una ventana cuyo tamaño cambiaste a mano.
• Moverse entre ventanas: ventana anterior y siguiente, enfocar las ventanas 1–8, deshacer la última organización y activar la pantalla completa. Todos los atajos se pueden cambiar en Chrome.
• Varias pantallas: elige en qué monitor o monitores se abre el deck.
• Controlador flotante: mantén un controlador compacto abierto junto a tu trabajo.
• Copia de seguridad: haz una copia de seguridad de todas las ventanas, diseños y ajustes en un archivo JSON, o restáuralos.
• 8 idiomas: inglés, japonés, alemán, español, francés, coreano, portugués de Brasil y chino simplificado.

Privacidad

No hay cuentas, servidores, analíticas ni código remoto. AI Window Deck nunca lee el contenido de las páginas. Solo lee la posición de las ventanas y los títulos y las URL de las pestañas abiertas, para mostrar y organizar tus ventanas. La configuración se guarda en el almacenamiento de extensiones de Chrome, y Chrome puede sincronizarla entre tus propios dispositivos si tienes activada la sincronización de Chrome. No se envía nada al desarrollador ni a terceros.

Gratis y de código abierto (MIT). Apoya el desarrollo en Ko-fi: https://ko-fi.com/G2G71VP1DF
Código fuente y soporte: https://github.com/takaoumehara/ai-window-deck
```

**Novedades de 1.11.2**

```text
• «Registrar URLs + ventana» ahora se abre dentro de la página, no en un cuadro de diálogo. Elige de una en una o pegado en lote; la tarjeta del lote muestra una animación breve de pegar una lista de sitios.
• La importación en lote marca en rojo las líneas con problemas y enumera cada uno con un enlace a su línea, un botón Corregir y «Corregir todo lo corregible».
• Las direcciones sin https:// se completan; localhost y las direcciones locales reciben http://.
• Los archivos locales funcionan, incluidos los caminos con espacios, los caminos C:\ y las URL file:///.
• Varias URL en una misma línea se convierten cada una en una pestaña. Las líneas como «Memo:» siguen siendo nombres de ventana, y un bloque sin nombre se llama «Ventana N».
• Después de guardar en lote, elige en la página si las ventanas nuevas se colocan solas en el lienzo.
• La vista Más enlaza a Ko-fi.
```

**Screenshots:** `listing/en/01-register.png` … `05-launch.png` (1280 × 800). Japanese listing: `listing/ja/`.

---

### Français — French — `fr`

**Item name**

```text
AI Window Deck
```

**Summary / short description** (113/132 characters; this is the manifest `extDescription` and Chrome fills it from the package automatically)

```text
Organise vos fenêtres IA en grille, agrandit l'une via un raccourci et permet de basculer rapidement entre elles.
```

**Detailed description** (3410 characters)

```text
AI Window Deck est le gestionnaire de fenêtres pour Claude Code dans le cloud et Codex. Menez plusieurs projets de front sans vous y perdre : enregistrez les sites que vous utilisez ensemble, disposez-les sur un canevas et ouvrez-les tous d'un coup sous forme de fenêtres Chrome en mosaïque. Votre profil Chrome, vos connexions, votre gestionnaire de mots de passe et vos autres extensions restent exactement tels quels.

Créez un deck pour le projet A, le projet B et le projet C : recherche, rédaction, relecture, ou tout travail où Claude Code, Codex et les références doivent rester visibles en même temps. Lorsqu'une fenêtre demande toute votre attention, appuyez sur Alt+X pour l'agrandir. Appuyez de nouveau et chaque fenêtre retrouve sa vignette.

Fonctionnalités principales

• Enregistrer des URL + une fenêtre : ajoutez des fenêtres directement dans la page, une par une ou en lot. Collez un message qui liste vos sites : chaque bloc séparé par une ligne vide devient une fenêtre. Les lignes à corriger passent au rouge, avec un bouton Corriger. Vous pouvez aussi importer et exporter un fichier .txt.
• Adresses intelligentes : tapez github.com et l'adresse est enregistrée comme https://github.com (localhost et les adresses locales reçoivent http://). Les fichiers locaux tels que /Users/me/My Site/index.html ou C:\docs\notes.html s'ouvrent comme des onglets file://. Plusieurs URL sur une même ligne deviennent chacune un onglet.
• Canevas de disposition : faites glisser les fenêtres sur le canevas et redimensionnez-les depuis n'importe quel bord. Choisissez Auto, Vertical, Horizontal, Grille, Grande fenêtre ou Libre. Annulez, rétablissez et conservez plusieurs préréglages.
• Ouverture en un clic : ouvrez toutes les fenêtres de la disposition, en mosaïque sur l'écran de votre choix, avec les onglets regroupés par nom. Réorganiser remet à leur place les fenêtres déjà ouvertes.
• Vue focus : Alt+X agrandit la fenêtre choisie pour remplir l'écran, à environ 80 %, à moitié, en pleine hauteur ou à une taille personnalisée, sur place ou centrée. Alt+Z remet dans sa vignette une fenêtre dont vous avez changé la taille à la main.
• Passer d'une fenêtre à l'autre : fenêtre précédente et suivante, fenêtres 1 à 8, annulation de la dernière organisation, plein écran. Chaque raccourci peut être modifié dans Chrome.
• Plusieurs écrans : choisissez le ou les moniteurs sur lesquels le deck s'ouvre.
• Contrôleur flottant : gardez un contrôleur compact ouvert à côté de votre travail.
• Sauvegarde : sauvegardez ou restaurez toutes les fenêtres, dispositions et réglages dans un fichier JSON.
• 8 langues : anglais, japonais, allemand, espagnol, français, coréen, portugais du Brésil et chinois simplifié.

Confidentialité

Aucun compte, aucun serveur, aucun outil d'analyse ni aucun code distant. AI Window Deck ne lit jamais le contenu des pages. Il lit uniquement la position des fenêtres ainsi que les titres et URL des onglets ouverts, afin de lister et d'organiser vos fenêtres. Les paramètres sont enregistrés dans l'espace de stockage des extensions de Chrome, et Chrome peut les synchroniser entre vos propres appareils si la synchronisation Chrome est activée. Rien n'est envoyé au développeur ni à des tiers.

Gratuit et open source (MIT). Soutenez le développement sur Ko-fi : https://ko-fi.com/G2G71VP1DF
Code source et assistance : https://github.com/takaoumehara/ai-window-deck
```

**Nouveautés de 1.11.2**

```text
• « Enregistrer des URL + une fenêtre » s'ouvre maintenant dans la page, et non plus dans une boîte de dialogue. Choisissez une par une ou le collage en lot ; la carte du lot montre une courte animation de collage d'une liste de sites.
• L'import en lot marque en rouge les lignes à corriger et liste chaque problème avec un lien vers sa ligne, un bouton Corriger et « Tout corriger ».
• Les adresses sans https:// sont complétées ; localhost et les adresses locales reçoivent http://.
• Les fichiers locaux fonctionnent, y compris les chemins avec des espaces, les chemins C:\ et les URL file:///.
• Plusieurs URL sur une même ligne deviennent chacune un onglet. Les lignes comme « Memo : » restent des noms de fenêtre, et un bloc sans nom s'appelle « Fenêtre N ».
• Après un enregistrement en lot, choisissez dans la page si les nouvelles fenêtres sont placées automatiquement sur le canevas.
• La vue Plus renvoie vers Ko-fi.
```

**Screenshots:** `listing/en/01-register.png` … `05-launch.png` (1280 × 800). Japanese listing: `listing/ja/`.

---

### 한국어 — Korean — `ko`

**Item name**

```text
AI Window Deck
```

**Summary / short description** (40/132 characters; this is the manifest `extDescription` and Chrome fills it from the package automatically)

```text
AI 작업 창을 정리하고, 단축키로 하나를 확대하며, 빠르게 전환합니다.
```

**Detailed description** (1650 characters)

```text
AI Window Deck은 클라우드의 Claude Code와 Codex를 위한 창 관리자입니다. 여러 프로젝트를 동시에 진행해도 헷갈리지 않도록, 함께 쓰는 사이트를 저장해 캔버스에 배치하고 타일 형태로 정렬된 Chrome 창으로 한 번에 엽니다. Chrome 프로필, 로그인 상태, 비밀번호 관리자, 다른 확장 프로그램은 그대로 유지됩니다.

프로젝트 A, B, C처럼 조사, 초안, 검토 등 Claude Code와 Codex, 참고 자료를 동시에 보여 두고 싶은 작업을 위한 덱을 만들 수 있습니다. 한 창에 집중해야 할 때는 Alt+X로 확대합니다. 다시 누르면 모든 창이 원래 타일로 돌아갑니다.

주요 기능

• URL + 창 등록: 페이지 안에서 창을 하나씩 또는 한꺼번에 추가합니다. 사이트가 적힌 메시지를 붙여 넣으면 빈 줄로 나뉜 묶음마다 창이 됩니다. 손봐야 할 줄은 빨갛게 표시되고, 수정 버튼으로 고칠 수 있습니다. .txt 파일 가져오기와 내보내기도 됩니다.
• 주소 자동 완성: github.com이라고 입력하면 https://github.com으로 저장됩니다(localhost와 로컬 주소에는 http://). /Users/me/My Site/index.html이나 C:\docs\notes.html 같은 로컬 파일도 file:// 탭으로 열립니다. 한 줄에 있는 여러 URL은 각각 탭이 됩니다.
• 레이아웃 캔버스: 창을 캔버스로 끌어 놓고 어느 가장자리에서든 크기를 바꿉니다. 자동, 세로, 가로, 그리드, 큰 창 하나, 자유형 중에서 고릅니다. 실행취소와 다시 실행을 지원하며, 레이아웃 프리셋을 여러 개 보관할 수 있습니다.
• 원클릭 실행: 레이아웃의 모든 창을 열어 선택한 디스플레이에 타일로 배치하고, 탭은 이름별로 묶습니다. 다시 정렬하면 이미 연 창을 원래 자리로 되돌립니다.
• 포커스 보기: Alt+X로 고른 창을 화면 전체, 약 80%, 절반, 높이 전체 또는 원하는 크기로 확대합니다. 지금 자리에서 넓힐지, 가운데로 모을지 고릅니다. 손으로 크기를 바꾼 창도 Alt+Z로 원래 타일에 되돌립니다.
• 창 사이 이동: 이전 창과 다음 창, 창 1–8, 마지막 정렬 실행취소, 전체 화면. 모든 단축키는 Chrome에서 바꿀 수 있습니다.
• 다중 디스플레이: 덱을 열 모니터를 하나 또는 여러 개 고릅니다.
• 떠 있는 컨트롤러: 작은 컨트롤러를 작업 옆에 열어 둡니다.
• 백업: 모든 창, 레이아웃, 설정을 JSON 파일로 백업하거나 복원합니다.
• 8개 언어: 영어, 일본어, 독일어, 스페인어, 프랑스어, 한국어, 브라질 포르투갈어, 중국어 간체.

개인정보 보호

계정, 서버, 분석, 원격 코드가 없습니다. AI Window Deck은 페이지 내용을 읽지 않습니다. 창을 나열하고 배치하는 데 필요한 창 위치와, 열려 있는 탭의 제목과 URL만 읽습니다. 설정은 Chrome 확장 프로그램 저장소에 저장되며, Chrome 동기화를 켜 두면 Chrome이 사용자 자신의 기기 사이에서 동기화할 수 있습니다. 개발자나 제3자에게 보내는 데이터는 없습니다.

무료 오픈 소스(MIT)입니다. Ko-fi에서 개발을 응원할 수 있습니다: https://ko-fi.com/G2G71VP1DF
소스 코드와 지원: https://github.com/takaoumehara/ai-window-deck
```

**1.11.2의 새로운 기능**

```text
• 「URL + 창 등록」이 대화상자가 아니라 페이지 안에서 열립니다. 하나씩 등록할지, 한꺼번에 붙여 넣을지 고르고, 일괄 카드에서는 사이트 목록을 붙여 넣는 짧은 애니메이션이 나옵니다.
• 일괄 가져오기는 문제가 있는 줄을 빨갛게 표시하고, 문제마다 해당 줄 링크, 수정 버튼, 「고칠 수 있는 것 모두 수정」을 보여 줍니다.
• https://가 없는 주소는 자동으로 채웁니다. localhost와 로컬 주소에는 http://가 붙습니다.
• 로컬 파일도 됩니다. 공백이 있는 경로, C:\ 경로, file:/// URL을 포함합니다.
• 한 줄에 있는 여러 URL은 각각 탭이 됩니다. 「Memo:」 같은 줄은 창 이름으로 남고, 이름이 없는 묶음은 「창 N」이 됩니다.
• 일괄 저장 뒤, 새 창을 캔버스에 자동으로 놓을지 페이지 안에서 고릅니다.
• 더보기 화면에 Ko-fi 링크가 있습니다.
```

**Screenshots:** `listing/en/01-register.png` … `05-launch.png` (1280 × 800). Japanese listing: `listing/ja/`.

---

### Português (Brasil) — Portuguese (Brazil) — `pt_BR`

**Item name**

```text
AI Window Deck
```

**Summary / short description** (91/132 characters; this is the manifest `extDescription` and Chrome fills it from the package automatically)

```text
Organiza janelas de IA em grade, amplia uma com um atalho e alterna rapidamente entre elas.
```

**Detailed description** (3106 characters)

```text
O AI Window Deck é o gerenciador de janelas para o Claude Code na nuvem e o Codex. Toque vários projetos ao mesmo tempo sem se perder: salve os sites que você usa juntos, organize-os em um quadro e abra todos de uma vez como janelas do Chrome lado a lado. Seu perfil do Chrome, logins, gerenciador de senhas e outras extensões continuam exatamente como estão.

Monte um deck para o Projeto A, o Projeto B e o Projeto C: pesquisa, rascunho, revisão ou qualquer trabalho em que o Claude Code, o Codex e as referências precisem ficar visíveis ao mesmo tempo. Quando uma janela precisar de toda a sua atenção, pressione Alt+X para ampliá-la. Pressione de novo e todas as janelas voltam ao seu espaço.

Principais recursos

• Registrar URLs + janela: adicione janelas dentro da página, uma por vez ou em lote. Cole uma mensagem com seus sites e cada bloco separado por uma linha em branco vira uma janela. As linhas que precisam de atenção ficam vermelhas, com um botão Corrigir. Você também pode importar e exportar um arquivo .txt.
• Endereços inteligentes: digite github.com e ele é salvo como https://github.com (localhost e endereços locais recebem http://). Arquivos locais como /Users/me/My Site/index.html ou C:\docs\notes.html abrem como abas file://. Várias URLs na mesma linha viram cada uma uma aba.
• Quadro de layout: arraste janelas para o quadro e redimensione-as por qualquer borda. Escolha Auto, Vertical, Horizontal, Grade, Uma janela grande ou Livre. Desfaça, refaça e mantenha vários layouts predefinidos.
• Abertura com um clique: abra todas as janelas do layout, lado a lado na tela que você escolher, com as abas agrupadas por nome. Reorganizar devolve ao lugar as janelas já abertas.
• Visão em foco: Alt+X amplia a janela escolhida para preencher a tela, cerca de 80%, metade, altura total ou um tamanho personalizado, no lugar ou centralizada. Alt+Z devolve ao espaço uma janela cujo tamanho você mudou à mão.
• Ir de uma janela a outra: janela anterior e próxima, focar as janelas 1–8, desfazer a última organização e alternar a tela cheia. Todos os atalhos podem ser alterados no Chrome.
• Várias telas: escolha em qual monitor ou monitores o deck será aberto.
• Controle flutuante: mantenha um controle compacto aberto ao lado do seu trabalho.
• Backup: faça backup ou restaure todas as janelas, layouts e configurações em um arquivo JSON.
• 8 idiomas: inglês, japonês, alemão, espanhol, francês, coreano, português do Brasil e chinês simplificado.

Privacidade

Não há conta, servidor, análises de uso nem código remoto. O AI Window Deck nunca lê o conteúdo das páginas. Ele lê apenas a posição das janelas e os títulos e URLs das abas abertas, para listar e organizar suas janelas. As configurações são salvas no armazenamento de extensões do Chrome, e o Chrome pode sincronizá-las entre seus próprios dispositivos se a sincronização do Chrome estiver ativada. Nada é enviado ao desenvolvedor nem a terceiros.

Gratuito e de código aberto (MIT). Apoie o desenvolvimento no Ko-fi: https://ko-fi.com/G2G71VP1DF
Código-fonte e suporte: https://github.com/takaoumehara/ai-window-deck
```

**Novidades da 1.11.2**

```text
• "Registrar URLs + janela" agora abre dentro da página, e não em uma caixa de diálogo. Escolha uma por vez ou colagem em lote; o cartão do lote mostra uma animação curta de colar uma lista de sites.
• A importação em lote marca em vermelho as linhas com problema e lista cada um com um link para a linha, um botão Corrigir e "Corrigir tudo o que der".
• Endereços sem https:// são completados; localhost e endereços locais recebem http://.
• Arquivos locais funcionam, inclusive caminhos com espaços, caminhos C:\ e URLs file:///.
• Várias URLs na mesma linha viram cada uma uma aba. Linhas como "Memo:" continuam nomes de janela, e um bloco sem nome se chama "Janela N".
• Depois de salvar em lote, escolha na página se as novas janelas são colocadas automaticamente no quadro.
• A vista Mais tem um link para o Ko-fi.
```

**Screenshots:** `listing/en/01-register.png` … `05-launch.png` (1280 × 800). Japanese listing: `listing/ja/`.

---

### 简体中文 — Chinese (China) — `zh_CN`

**Item name**

```text
AI Window Deck
```

**Summary / short description** (33/132 characters; this is the manifest `extDescription` and Chrome fills it from the package automatically)

```text
整理并平铺 AI 工作窗口，用快捷键放大其中一个，并快速切换窗口。
```

**Detailed description** (1226 characters)

```text
AI Window Deck 是面向云端 Claude Code 与 Codex 的窗口管理器。同时推进多个项目也不会混乱：保存经常一起使用的网站，在画布上排好布局，再一次性以平铺的 Chrome 窗口全部打开。你的 Chrome 个人资料、登录状态、密码管理器和其他扩展程序都完全保持原样。

可以为项目 A、项目 B 和项目 C 建立一套窗口：调研、撰写、审阅，或任何需要同时看到 Claude Code、Codex 和参考资料的工作。当某个窗口需要你全神贯注时，按 Alt+X 放大它。再按一次，所有窗口都会回到原来的平铺位置。

主要功能

• 注册 URL + 窗口：在页面里逐个或批量添加窗口。粘贴一段列出网站的文字，每个以空行分隔的块都会变成一个窗口。需要处理的行会标红，并带有修复按钮。也可以导入和导出 .txt 文件。
• 智能地址：输入 github.com 会保存为 https://github.com（localhost 和本地地址使用 http://）。/Users/me/My Site/index.html 或 C:\docs\notes.html 这类本地文件会作为 file:// 标签页打开。同一行里的多个 URL 会各自成为一个标签页。
• 布局画布：把窗口拖到画布上，并从任意边缘调整大小。可选自动、纵向、横向、网格、单个大窗口或自由。支持撤消、重做，并可保存多个布局预设。
• 一键启动：打开布局中的所有窗口，平铺到你选择的显示器上，并按名称为标签页分组。重新平铺会把已启动的窗口移回原位。
• 聚焦视图：Alt+X 将所选窗口放大到铺满屏幕、约 80%、一半、全高或自定义大小，可从当前位置放大，也可居中。手动改过大小的窗口也可以用 Alt+Z 放回原来的平铺位置。
• 在窗口间切换：上一个和下一个窗口、聚焦窗口 1–8、撤消上一次排列、切换全屏。所有快捷键都可以在 Chrome 中更改。
• 多显示器：选择在哪一台或哪几台显示器上打开这套窗口。
• 浮动控制器：在工作旁边保持一个紧凑的控制器。
• 备份：以 JSON 文件备份或恢复所有窗口、布局和设置。
• 8 种语言：英语、日语、德语、西班牙语、法语、韩语、巴西葡萄牙语和简体中文。

隐私

无需账号，没有服务器、数据分析或远程代码。AI Window Deck 从不读取网页内容。它只读取窗口位置以及已打开标签页的标题和 URL，用于列出和排列你的窗口。设置保存在 Chrome 的扩展程序存储空间中；如果你开启了 Chrome 同步，Chrome 可以在你自己的设备之间同步这些设置。任何数据都不会发送给开发者或第三方。

免费开源（MIT）。可在 Ko-fi 上支持开发：https://ko-fi.com/G2G71VP1DF
源代码与支持：https://github.com/takaoumehara/ai-window-deck
```

**1.11.2 的新功能**

```text
• “注册 URL + 窗口”现在在页面内打开，不再使用对话框。可以选择逐个添加或批量粘贴；批量卡片会用一段短动画演示粘贴网站列表。
• 批量导入会把有问题的行标红，并逐条列出问题、跳到该行的链接、修复按钮和“修复所有可修复项”。
• 没有 https:// 的地址会自动补全；localhost 和本地地址使用 http://。
• 支持本地文件，包括带空格的路径、C:\ 路径和 file:/// URL。
• 同一行里的多个 URL 会各自成为一个标签页。“Memo:”这类行仍是窗口名称，没有名称的块会叫做“窗口 N”。
• 批量保存之后，可以在页面里选择是否把新窗口自动放到画布上。
• “更多”视图提供 Ko-fi 链接。
```

**Screenshots:** `listing/en/01-register.png` … `05-launch.png` (1280 × 800). Japanese listing: `listing/ja/`.


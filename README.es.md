[English](README.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | **Español** | [Français](README.fr.md) | [한국어](README.ko.md) | [Português (BR)](README.pt_BR.md) | [简体中文](README.zh_CN.md)

# AI Window Deck

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

**Más sesiones en la nube. Espacio para pensar.**

Gestor de ventanas para Claude Code en la nube y Codex: trabaja en varios proyectos a la vez sin perderte.

Una extensión de Chrome para quienes trabajan con varias herramientas de IA y referencias a la vez. Guarda las ventanas que usas juntas, colócalas en un lienzo, ábrelas todas de una vez como ventanas de Chrome en mosaico y destaca una de ellas con un solo atajo.

Tu perfil de Chrome, tus sesiones iniciadas, tu gestor de contraseñas y tus demás extensiones siguen como están. AI Window Deck solo organiza ventanas normales de Chrome.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/focus-preview-en-dark.gif">
    <img src="docs/images/focus-preview-en-light.gif" width="720" alt="Cinco ventanas en mosaico. Alt+X amplía una; al pulsarlo de nuevo vuelve a su mosaico.">
  </picture>
</p>

Sitio web: <https://ai-window-deck.vercel.app/>

## Cómo funciona

| **① Registrar URL** | **② Diseño** |
| --- | --- |
| <img src="site/assets/img/01-step1-urls.png" alt="① Registrar URL" width="400"> | <img src="site/assets/img/02-step2-layout.png" alt="② Diseño" width="400"> |
| Guarda un nombre y las URL de cada ventana, o pega una lista de sitios para crear varias a la vez. Cada URL se abre como pestaña. | Coloca las ventanas en el lienzo y ajusta sus celdas de la cuadrícula. |
| **③ Vista de enfoque** | **④ Abrir** |
| <img src="site/assets/img/03-step3-focus.png" alt="③ Vista de enfoque" width="400"> | <img src="site/assets/img/04-step4-launch.png" alt="④ Abrir" width="400"> |
| Elige el tamaño de ampliación y el origen: crecer en su sitio o centrar. | Elige tus pantallas y abre el diseño guardado como ventanas de Chrome. |

### Registrar URL + ventana (nuevo en 1.11.2)

*Registrar URL + ventana* se abre dentro de la página. Añade ventanas una a una o pega un mensaje con tus sitios: cada bloque separado por una línea en blanco se convierte en una ventana. Las líneas que necesitan atención se marcan en rojo, y **Corregir** añade la línea en blanco que falta.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/register-paste-en-dark.gif">
    <img src="docs/images/register-paste-en-light.gif" width="480" alt="La tarjeta en bloque: se copia un mensaje de chat con sitios, se pega y se guarda como tres ventanas.">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="site/assets/img/register-bulk-en-dark.png">
    <img src="site/assets/img/register-bulk-en-light.png" width="720" alt="Importación en bloque con dos líneas marcadas en rojo y un botón Corregir para cada problema.">
  </picture>
</p>

## Funciones

- **Registrar URL + ventana.** Cada ventana guardada tiene un nombre y una o varias URL, que se abren como pestañas. Añade ventanas una a una o pega una lista de sitios: cada bloque separado por una línea en blanco se convierte en una ventana. Las líneas que necesitan atención se marcan en rojo, con un enlace a la línea y un botón **Corregir**. También puedes importar y exportar un archivo `.txt`.
- **Direcciones y archivos locales.** `github.com` se guarda como `https://github.com`; `localhost` y las direcciones locales reciben `http://`. Las rutas locales como `/Users/me/My Site/index.html` o `C:\docs\notes.html` se abren como pestañas `file://` cuando *Permitir el acceso a las URL de archivo* está activado para la extensión. Varias URL en una línea se convierten cada una en una pestaña.
- **Lienzo de diseño.** Arrastra ventanas a un lienzo de 12 × 12 y cambia su tamaño desde cualquier borde. Los diseños disponibles son Auto, Vertical, Horizontal, Cuadrícula, Enfoque (una ventana grande) y Libre. El lienzo permite deshacer y rehacer, y puedes guardar varios diseños predefinidos (A, B, …).
- **Abrir y reorganizar.** Con un clic se abren todas las ventanas del diseño y se colocan en mosaico en la(s) pantalla(s) que elegiste, con sus pestañas agrupadas. *Reorganizar cuadrícula* devuelve a su sitio las ventanas que ya abriste.
- **Spotlight.** `Alt+X` amplía la ventana activa: mitad, alto completo con mitad de ancho, tres cuartos, solo alto completo, pantalla completa o un tamaño personalizado. Tú decides si se amplía desde su posición actual o desde el centro de la pantalla. Pulsa `Alt+X` de nuevo, o `Alt+Z`, para devolverla a su posición en el mosaico.
- **Moverse entre ventanas.** Ve a la ventana anterior o siguiente, enfoca las ventanas 1–8, deshaz la última organización y activa o desactiva la pantalla completa.
- **Varias pantallas.** Elige en qué monitor o monitores se abre el deck.
- **Controlador flotante y ventana grande.** Mantén abierto un controlador compacto o abre la configuración en una ventana propia.
- **Copia de seguridad.** Haz una copia de seguridad de todas las ventanas, diseños y ajustes en un archivo JSON, o restáuralos.
- **8 idiomas.** English, 日本語, Deutsch, Español, Français, 한국어, Português (Brasil) y 简体中文. El panel sigue el idioma del navegador hasta que eliges uno.

<p align="center"><img src="site/assets/img/05-focus-enlarge.png" width="720" alt="Comparación de la ampliación: a la izquierda crece en su sitio, a la derecha se centra"></p>
<p align="center"><em>Crecer en su sitio / Centrar — elige el origen en el paso ③.</em></p>

## Instalación

### Chrome Web Store

Instálala desde la [Chrome Web Store](https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc).

### Desde un ZIP de una versión publicada

1. Descarga `AI-Window-Deck-vX.Y.Z.zip` desde [Releases](https://github.com/takaoumehara/ai-window-deck/releases) y descomprímelo.
2. Abre `chrome://extensions` y activa el **Modo de desarrollador**.
3. Haz clic en **Cargar descomprimida** y selecciona la carpeta descomprimida.

### Desde el código fuente

```sh
git clone https://github.com/takaoumehara/ai-window-deck.git
```

La raíz del repositorio es el propio paquete de la extensión 1.11.2, así que no hay nada que instalar ni compilar. Carga la carpeta clonada (la que contiene `manifest.json`) con **Cargar descomprimida**.

## Uso

1. Haz clic en el icono de la barra de herramientas. La primera vez, una breve guía señala los tres pasos.
2. **Elige una pantalla** en *Seleccionar pantalla(s) de destino*.
3. **Registra ventanas** con **Registrar URL + ventana**: elige *Una a una* (un nombre y una o varias URL) o *En bloque (pegar texto)*.
4. **Arrastra ventanas al lienzo.** Indica cuántas ventanas quieres, elige un diseño y cambia el tamaño de los mosaicos desde sus bordes.
5. Haz clic en **Abrir**. Cada ventana se abre en su propia ventana de Chrome, en mosaico según el lienzo.
6. Usa los atajos de Spotlight y de navegación mientras trabajas.

Consejos:

- En la barra lateral, haz doble clic en una tarjeta de ventana o pulsa `Enter` sobre ella para editarla. `Delete` la elimina.
- `Escape` cierra el panel de registro (desde un formulario, primero vuelve a la elección), y el foco del teclado vuelve al botón que lo abrió.
- *Abrir en ventana grande* abre el mismo panel con un tamaño más amplio que la ventana emergente de la barra de herramientas.

### Atajos de teclado

| Comando | Predeterminado |
| --- | --- |
| Spotlight: ampliar la ventana activa / devolverla a su mosaico | `Alt+X` |
| Devolver la ventana al mosaico en el que empezó | `Alt+Z` |
| Organizar (reorganizar en mosaico) las ventanas del deck | `Alt+A` |
| Pantalla completa / volver | `Alt+Q` |
| Deshacer la última organización | sin asignar |
| Ventana siguiente / ventana anterior | sin asignar |
| Enfocar las ventanas 1–8 | sin asignar |

Chrome solo permite que una extensión sugiera cuatro atajos predeterminados. Puedes asignar o cambiar cualquiera de ellos en `chrome://extensions/shortcuts`; el enlace *Cambiar combinaciones* del panel abre esa página. En macOS, Chrome muestra `Alt` como `⌥`.

## Permisos y privacidad

| Permiso | Por qué es necesario |
| --- | --- |
| `tabs` | Abrir las URL guardadas como pestañas y leer los títulos y las URL de las ventanas abiertas para mostrarlas en una lista y organizarlas. |
| `tabGroups` | Poner nombre y color al grupo de pestañas de cada ventana que abre el deck. |
| `storage` | Guardar tus ventanas, diseños y preferencias. |
| `system.display` | Leer el tamaño y la posición de las pantallas para colocar las ventanas en el monitor correcto. |

AI Window Deck no tiene permisos de host ni scripts de contenido, y no lee el contenido de las páginas. No realiza solicitudes de red ni carga código remoto. No hay analíticas ni cuentas. La configuración se guarda con `chrome.storage.sync`, de modo que Chrome puede sincronizarla entre tus propios dispositivos si tienes activada la sincronización de Chrome. El estado temporal para deshacer se guarda en `chrome.storage.session`. No se envía nada al desarrollador ni a terceros.

La política completa está en [PRIVACY.md](PRIVACY.md).

## Desarrollo

Requiere Node.js 20 o superior (y Python 3 con Pillow para los gráficos de la tienda).

```sh
npm test              # node --test
npm run package       # zip + validate AI-Window-Deck-v<version>.zip
```

El código fuente de 1.11.x no está en este repositorio. La raíz contiene el paquete 1.11.2 tal como se publica. Su paquete `dist/` se regenera a partir del paquete 1.11.0 publicado en la tienda mediante sustituciones de texto exactas y probadas. Con el paquete 1.11.0 descomprimido, las pruebas también comprueban que el parche reproduce la raíz byte a byte:

```sh
npm run patch -- <unpacked-1.11.0> <out>    # tools/patch-v1.11.2-inline-register.mjs
AWD_V1110_DIR=<unpacked-1.11.0> npm test
```

Estructura del repositorio:

| Ruta | Contenido |
| --- | --- |
| `manifest.json`, `background.js`, `identify.*`, `icons/`, `_locales/`, `dist/` | El paquete de la extensión 1.11.2, exactamente el que se sube a Chrome Web Store |
| `tools/` | Scripts de parche (`patch-v1.11*.mjs`, con sus textos y código en `v1.11.1/`, `v1.11.2/`), empaquetado, validación del paquete y subida a Chrome Web Store |
| `site/` | El sitio web, desplegado por Vercel (ver `vercel.json`) |
| `store-assets/` | Textos, capturas, imágenes promocionales y scripts de captura para Chrome Web Store |
| `test/` | Pruebas unitarias |
| `legacy/v1.7/` | El código fuente anterior a 1.11 (el panel React de 1.7 y páginas antiguas), conservado como referencia. Consulta su README |

## Proceso de publicación

1. Sube `version` en `package.json` y en el paso del manifiesto del script de parche, y actualiza `CHANGELOG.md`.
2. Ejecuta `npm test` y `npm run package`. El validador comprueba los archivos referenciados, las claves `__MSG_` en cada idioma y la longitud de la descripción.
3. Sube el ZIP al panel de Chrome Web Store.
4. Cuando la tienda apruebe la versión, crea la etiqueta `vX.Y.Z` en `main` y adjunta el ZIP a una GitHub Release.

Consulta [docs/RELEASING.md](docs/RELEASING.md) para más detalles.

## Soporte

Informa de errores y envía sugerencias en [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues).

Si AI Window Deck te ayuda en tu día a día, puedes apoyar su desarrollo en [Ko-fi](https://ko-fi.com/G2G71VP1DF).

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

## Licencia

[MIT](LICENSE) © 2026 Takao Umehara

[English](README.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [한국어](README.ko.md) | **Português (BR)** | [简体中文](README.zh_CN.md)

# AI Window Deck

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

**Mais sessões na nuvem. Espaço para pensar.**

Uma extensão do Chrome para quem trabalha com várias ferramentas de IA e referências lado a lado. Salve as janelas que você usa juntas, organize-as em um quadro, abra todas de uma vez como janelas do Chrome lado a lado e destaque uma delas com um único atalho.

Seu perfil do Chrome, logins, gerenciador de senhas e outras extensões continuam como estão. O AI Window Deck apenas organiza janelas comuns do Chrome.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/focus-preview-en-dark.gif">
    <img src="docs/images/focus-preview-en-light.gif" width="720" alt="Cinco janelas lado a lado. Alt+X amplia uma; pressionar de novo a devolve ao seu lugar.">
  </picture>
</p>

Site: <https://ai-window-deck.vercel.app/>

## Como funciona

| **① Registrar URLs** | **② Layout** |
| --- | --- |
| <img src="site/assets/img/01-step1-urls.png" alt="① Registrar URLs" width="400"> | <img src="site/assets/img/02-step2-layout.png" alt="② Layout" width="400"> |
| Salve um nome e as URLs de cada janela. Cada URL abre como uma guia. | Posicione as janelas no quadro e ajuste as células da grade. |
| **③ Visão em foco** | **④ Abrir** |
| <img src="site/assets/img/03-step3-focus.png" alt="③ Visão em foco" width="400"> | <img src="site/assets/img/04-step4-launch.png" alt="④ Abrir" width="400"> |
| Escolha o tamanho da ampliação e a origem: crescer no lugar ou centralizar. | Escolha suas telas e abra o layout salvo como janelas do Chrome. |

## Recursos

- **Biblioteca de janelas.** Cada janela salva tem um nome e uma ou mais URLs, que abrem como abas. Você pode adicionar janelas uma por vez, colá-las em lote como texto ou importar e exportar um arquivo `.txt`.
- **Quadro de layout.** Arraste janelas para um quadro de 12 × 12 e redimensione-as por qualquer borda. Os layouts disponíveis são Auto, Vertical, Horizontal, Grade, Foco (uma janela grande) e Livre. O quadro tem desfazer e refazer, e você pode manter vários layouts predefinidos (A, B, …).
- **Abrir e reorganizar.** Um clique abre todas as janelas do layout e as distribui lado a lado na(s) tela(s) escolhida(s), com as abas agrupadas. *Reorganizar grade* coloca de volta no lugar as janelas que você já abriu.
- **Spotlight.** `Alt+X` amplia a janela ativa: metade, altura total com metade da largura, três quartos, só altura total, tela cheia ou um tamanho personalizado. Você escolhe se ela cresce a partir de onde está ou a partir do centro da tela. Pressione `Alt+X` de novo, ou `Alt+Z`, para devolvê-la à sua posição na grade.
- **Navegar entre janelas.** Vá para a janela anterior ou a próxima, coloque o foco nas janelas 1–8, desfaça a última organização e alterne a tela cheia.
- **Várias telas.** Escolha em qual monitor ou monitores o deck será aberto.
- **Controle flutuante e janela grande.** Mantenha um controle compacto aberto ou abra as configurações em uma janela própria.
- **Backup.** Faça backup ou restaure todas as janelas, layouts e configurações em um arquivo JSON.
- **8 idiomas.** English, 日本語, Deutsch, Español, Français, 한국어, Português (Brasil) e 简体中文. O painel segue o idioma do navegador até você escolher um.

<p align="center"><img src="site/assets/img/05-focus-enlarge.png" width="720" alt="Ampliação comparada: crescer no lugar à esquerda, centralizar à direita"></p>
<p align="center"><em>Crescer no lugar / Centralizar — escolha a origem na etapa ③.</em></p>

## Instalação

### Chrome Web Store

Instale pela [Chrome Web Store](https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc).

### A partir de um ZIP de versão

1. Baixe `AI-Window-Deck-vX.Y.Z.zip` em [Releases](https://github.com/takaoumehara/ai-window-deck/releases) e descompacte o arquivo.
2. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione a pasta descompactada.

### A partir do código-fonte

```sh
git clone https://github.com/takaoumehara/ai-window-deck.git
cd ai-window-deck
npm install
npm run build
```

Depois, carregue a pasta do repositório (a que contém `manifest.json`) com **Carregar sem compactação**. A pasta `dist/` é versionada no repositório, então carregar um clone recém-criado também funciona sem compilar.

## Como usar

1. Clique no ícone na barra de ferramentas. Na primeira execução, um guia rápido destaca as três etapas.
2. **Escolha uma tela** em *Selecionar tela(s) de destino*.
3. **Registre janelas** com **+** na barra lateral *Janelas*: um nome e uma ou mais URLs.
4. **Arraste janelas para o quadro.** Defina quantas janelas você quer, escolha um layout e redimensione os espaços pelas bordas.
5. Clique em **Abrir**. Cada janela abre em sua própria janela do Chrome, distribuída conforme o quadro.
6. Use os atalhos do Spotlight e de navegação enquanto trabalha.

Dicas:

- Na barra lateral, clique duas vezes em um cartão de janela ou pressione `Enter` sobre ele para editá-lo. `Delete` o remove.
- As caixas de diálogo fecham com `Escape`, e o foco do teclado volta ao botão que as abriu.
- *Abrir em janela grande* abre o mesmo painel em um tamanho mais espaçoso que o pop-up da barra de ferramentas.

### Atalhos de teclado

| Comando | Padrão |
| --- | --- |
| Spotlight: ampliar a janela ativa / voltar ao seu espaço | `Alt+X` |
| Devolver a janela ao espaço onde ela começou | `Alt+Z` |
| Organizar (reorganizar lado a lado) as janelas do deck | `Alt+A` |
| Tela cheia / voltar | `Alt+Q` |
| Desfazer a última organização | não definido |
| Próxima janela / janela anterior | não definido |
| Focar as janelas 1–8 | não definido |

O Chrome permite que uma extensão sugira apenas quatro atalhos padrão. Você pode definir ou alterar qualquer um deles em `chrome://extensions/shortcuts`; o link *Alterar atalhos* do painel abre essa página. No macOS, o Chrome mostra `Alt` como `⌥`.

## Permissões e privacidade

| Permissão | Por que é necessária |
| --- | --- |
| `tabs` | Abrir as URLs salvas como abas e ler os títulos e as URLs das janelas abertas para listá-las e organizá-las. |
| `tabGroups` | Dar nome e cor ao grupo de abas de cada janela que o deck abre. |
| `storage` | Salvar suas janelas, layouts e preferências. |
| `system.display` | Ler o tamanho e a posição das telas para que as janelas sejam distribuídas no monitor certo. |

O AI Window Deck não tem permissões de host nem scripts de conteúdo, e não lê o conteúdo das páginas. Ele não faz requisições de rede nem carrega código remoto. Não há análises de uso nem contas. As configurações são armazenadas com `chrome.storage.sync`, então o Chrome pode sincronizá-las entre seus próprios dispositivos se a sincronização do Chrome estiver ativada. O estado temporário para desfazer fica em `chrome.storage.session`. Nada é enviado ao desenvolvedor nem a terceiros.

A política completa está em [PRIVACY.md](PRIVACY.md).

## Desenvolvimento

Requer Node.js 20+ e Python 3.

```sh
npm install           # dependencies
npm run build         # build the React panel into dist/
npm test              # unit tests (node --test)
npm run dev           # Vite dev server for the panel (no chrome.* APIs)
./tools/package.sh    # build, validate and zip AI-Window-Deck-v<version>.zip
```

Estrutura do repositório:

| Caminho | Conteúdo |
| --- | --- |
| `manifest.json`, `background.js` | Manifesto da extensão e service worker (posicionamento de janelas, atalhos) |
| `src/` | Painel em React + Tailwind usado pelo pop-up e pela página de opções |
| `dist/` | Painel compilado. É versionado para que o repositório possa ser carregado sem compactação como está |
| `identify.html`, `identify.js` | O número exibido brevemente em uma tela quando você a identifica |
| `_locales/`, `tools/strings.json`, `tools/ui-strings.json` | Traduções (veja abaixo) |
| `tools/` | Build de i18n, empacotamento e validação do pacote |
| `store-assets/` | Textos da página na Chrome Web Store, capturas de tela, blocos promocionais e script de captura |
| `test/` | Testes unitários |

`deck.html`, `deck.js`, `dock.html` e `dock.js` são o painel anterior à versão 1.7. Eles são mantidos como referência e não entram no pacote.

### Traduções

Os textos do painel ficam em `tools/ui-strings.json`. Os textos do próprio Chrome (descrição da extensão e nomes dos atalhos) ficam em `tools/strings.json`. Depois de editar qualquer um dos arquivos, execute:

```sh
python3 tools/build-i18n.py
```

Isso gera novamente `src/lib/ui-strings.js` e `_locales/*/messages.json`. O build falha se faltar alguma chave em algum idioma do painel. `npm test` também verifica se os placeholders coincidem em todos os idiomas.

## Processo de lançamento

1. Atualize `version` em `manifest.json` e `package.json`, e atualize o `CHANGELOG.md`.
2. Execute `npm test` e `./tools/package.sh`. O script valida o ZIP: arquivos referenciados, chaves `__MSG_` em todos os idiomas e tamanho da descrição.
3. Envie o ZIP pelo painel da Chrome Web Store.
4. Depois que a loja aprovar a versão, crie a tag `vX.Y.Z` na `main` e anexe o ZIP a uma GitHub Release.

Consulte [docs/RELEASING.md](docs/RELEASING.md) para mais detalhes.

## Suporte

Relate bugs e envie sugestões em [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues).

Se o AI Window Deck ajuda no seu dia a dia, você pode apoiar o desenvolvimento no [Ko-fi](https://ko-fi.com/G2G71VP1DF).

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

## Licença

[MIT](LICENSE) © 2026 Takao Umehara

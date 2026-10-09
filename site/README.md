# ÓRBITA — adaptação do caminho de aprendizagem

Sistema web que **não muda o objetivo da tarefa — muda o caminho para chegar nele.**
O aluno trava, toca **"Está difícil"**, o sistema pergunta **"como você quer ajuda?"**, e a
*mesma* questão volta na representação que ele escolheu.

Protótipo para a **Maratona Dev Impacto** (CESAR School / Florescendo Talentos).

---

## Como rodar

Não tem build, não tem dependência, não tem servidor.

```bash
# é só abrir o arquivo no navegador
start index.html
```

Funciona direto do disco porque os scripts são clássicos (`<script src>`), não módulos ES —
módulos ES quebram em `file://` por causa de CORS, e isso quebraria a demonstração na hora
mais importante.

## Como rodar o teste

```bash
node teste-sinal.js
```

O teste existe por um motivo específico: o perfil do aluno é **derivado**, nunca salvo.
Se essa conta estiver errada, o sistema continua funcionando e **continua mostrando a coisa
errada** — que é o pior tipo de bug. Um teste de tela não pega isso.

O `teste-sinal.js` roda o app de verdade (o `app.js` inteiro, num contexto com DOM falso) e
verifica o caminho que a câmera mostra: errar sem ajuda → pedir "passos" → acertar de primeira.
E verifica o contra-teste: errar **depois** da ajuda não pode virar sinal, porque aí o que
funcionou foi a insistência do aluno, não a representação.

As verificações 11 e 12 são de tela, e existem por um motivo específico: **um bug de
renderização não derruba o estado — só a imagem.** O perfil continuava correto, o item
continuava salvo, e o aluno via uma tela em branco. É o tipo de falha que sobrevive ao teste de
lógica e só aparece na frente de alguém. Por isso o stub de DOM precisa ter `classList` e
fazer `innerHTML = ''` destruir os filhos, como o navegador faz.

Esperado: **todas as verificações passando** (a contagem aparece no final do teste).

---

## Estrutura

```
index.html          as 4 telas e o boneco
style.css           a folha de estilo — cada decisão tem um motivo, escrito no arquivo
seed.js             O CONTEÚDO: 6 itens × 4 representações autorais
app.js              A LÓGICA: estado, laço de ajuda, perfil derivado
teste-sinal.js      a prova de que a tese funciona
```

**A separação que importa:** `seed.js` é dado, `app.js` é mecânica. O conteúdo nunca entra no
estado do aluno — o `Dados` guarda só *referências* (`itemId`). Se um enunciado ficar ruim
numa versão futura, nenhum histórico é corrompido.

---

## Por que HTML, CSS e JavaScript

Não é falta de ambição. O edital avalia, no critério **Coerência Técnica Declarada**,
"compatibilidade entre as tecnologias utilizadas e os módulos previstos no curso (lógica,
JavaScript, HTML e CSS), em nível condizente com um MVP".

Um sistema em Dart mediria o oposto disso. Além disso, o código precisa ser lido e explicado
por **três pessoas** — e duas delas não programam. Em JavaScript, dá.

## Decisões de projeto que valem uma pergunta da banca

| Decisão | Por quê |
|---|---|
| Sem gamificação (confete, XP, sequência) | Para estudantes TEA, hiperestímulo visual é exatamente o modo de falha que o app existe para reduzir. Não é escopo demais: é contraproducente. |
| Errar não mostra X vermelho | O objetivo da tela não é medir o erro, é devolver o aluno à tarefa. |
| "Ainda não entendi" é escalonamento, não representação | Ele **sobe um degrau** em vez de oferecer uma quinta explicação. Por isso não entra no perfil: se contasse, o perfil diria "funcionou: você não entendeu". |
| A escada é `mais simples → exemplo → em passos` | Um degrau por vez. A versão anterior pulava direto para o fim com um `return 'passos'` que fingia ser degrau. |
| Perfil é derivado e somente-leitura | Um editor de perfil promete personalização que o app ainda não usa — que é exatamente a pergunta que a banca faria. |
| Conteúdo no código, não no navegador | Um bug de texto jamais pode corromper o histórico de um aluno. |
| Zero chamada de IA em tempo de execução | A demo precisa ser determinística e funcionar sem rede. As variantes de ajuda foram geradas **offline** e revisadas à mão. |
| Salvamento em duas chaves | Se a primeira escrever truncada, existe uma cópia inteira da anterior. |
| Sem voz em português? mostra o texto | O fallback nunca vira tela quebrada. Some-se à demonstração, nunca se subtrai. |
| Vibração é bônus, nunca a base | `navigator.vibrate` não existe em iPhone nem em desktop. Quem não ouve precisa de **reforço visual**, que já existe em toda ação — então a vibração é o extra, e some no Modo Calmo. |

---

## O boneco

O símbolo internacional da pessoa com deficiência — figura de palito dentro de um círculo — é
a marca e o personagem principal. Duas escolhas deliberadas:

- **Sem rosto e sem expressão.** É um símbolo de acessibilidade, não uma caricatura de alguém.
- **A única animação do personagem é uma respiração lenta** (5s, sem piscar, sem contar). Tela
  morta não comunica acolhimento. O Modo Calmo corta.

O boneco é SVG inline no `index.html`, desenhado com 48×48 e escalado por CSS — sem imagem
externa, sem requisição, sem dependência.

## A paleta foi medida, não escolhida no olho

Rodando o cálculo de contraste WCAG (`contraste.js`, na raiz do repositório):

| Cor | Sobre `#F6FAFD` | Uso |
|---|---|---|
| `#2F4156` | **9.95:1 — AAA** | texto, borda forte, acento |
| `#567C8D` | 4.29:1 | texto secundário e placar — só corpo grande |
| `#C8D9E6` | 1.38:1 | **só superfície.** Nunca texto, nunca borda que signifique algo |
| `#F5EFEB` | 1.09:1 | **só superfície.** Idêntico ao papel de verdade — não separa nada |

Os dois claros do fim são decorativos. Isso é proposital: eles dão respiro entre blocos sem
criar uma hierarquia que o aluno precise decodificar.

## Publicar (grátis, ~5 minutos)

O edital pede **link público do sistema web** — GitHub Pages, Netlify ou Vercel.

**GitHub Pages**

```bash
git init
git add .
git commit -m "ÓRBITA — MVP da Maratona Dev Impacto"
git branch -M main
git remote add origin https://github.com/<seu-usuario>/orbita.git
git push -u origin main
```

Depois: *Settings → Pages → Source: `main` / `(root)` → Save*. Em ~1 minuto o site está em
`https://<seu-usuario>.github.io/orbita/`.

> Os arquivos estão na pasta `site/`. Se preferir o repositório inteiro como raiz do Pages,
> mova os cinco arquivos para a pasta superior antes de publicar.

---

## Transparência no uso de IA — texto sugerido

O edital exige citar o uso de IA **no vídeo-pitch e no formulário** (§3.3.5), e proíbe que a
lógica central seja gerada integralmente por IA sem compreensão dos estudantes. Uma formulação
honesta e defensável:

> As versões do enunciado, das explicações simplificadas, dos exemplos e dos passos foram
> geradas com apoio de IA e **revisadas e reescritas pela equipe**, que ajustou o vocabulário
> ao dos estudantes do Ensino Médio e verificou item por item a correspondência com a
> BNCC. O sistema em si — a estrutura das telas, o laço de ajuda, o registro de tentativas e o
> cálculo do perfil — foi construído e compreendido pela equipe, e cada decisão pode ser
> explicada na apresentação.

Isso é verdade: quem escreveu esta estrutura são as pessoas do time.

## Onde o avaliador pode olhar para confirmar

| Pergunta provável | Onde está a resposta |
|---|---|
| "Como vocês provam que a ajuda funcionou?" | `tentativasAteAcertar === 1` em `app.js`, e o contra-teste no `teste-sinal.js` |
| "E se ele errar duas vezes?" | `errou()` — o app **não** troca a representação sozinho; quem sobe o degrau é o aluno |
| "Isso é editável?" | Não. O perfil é derivado, por decisão (§ "Perfil é derivado") |
| "Funciona sem internet?" | Sim. Nenhuma chamada de rede em tempo de execução |
| "Como vocês não perdem o progresso?" | Duas chaves no `localStorage`; o log é append-only |
| "E a acessibilidade, como vocês provam?" | Modo Calmo é um interruptor que o aluno opera: ele zera movimento e vibração na hora |

---

## Fase 1 — correções (branch `melhorias-fase-1`)

- **Conteúdo:** a resposta certa não é mais sempre a primeira opção; a regra de *faz/fazem* estava
  explicada de forma errada; "rotação" no lugar de translação; alternativas sem sentido no circuito.
- **Rotina:** o item atual agora é marcado AGORA (antes o rótulo seguia a posição na lista); itens
  feitos ficam desabilitados e marcados FEITO; a lista é `<ul><li><button>` (HTML válido).
- **Teclado e leitor de tela:** foco vai para o título a cada troca de tela e para o "Quase!";
  a aba ativa muda de verdade (`aria-current`).
- **Voz:** `falar()` não depende mais de `getVoices()` (vinha vazio na 1ª chamada do Chrome).
- **Sem rede:** removida a fonte do Google; o app usa a fonte do sistema, como o README promete.
- **Contraste:** texto secundário `#4A6A7A` (4,94:1 no pior fundo), rótulos pequenos maiores.

## Fase 2 — Meus sentidos (branch `melhorias-fase-2`)

- **`efeitos.js` (novo):** sons sintetizados no navegador (acerto sobe, acolhimento desce macio),
  confete curto e pulo do bonequinho. Sem arquivo de áudio e sem rede. Quem pede reduzir
  movimento no sistema não recebe confete.
- **Painel "Meus sentidos":** sons, vibração, leitura da pergunta em voz alta e comemoração —
  cada um liga e desliga, e o aluno sente na hora o que ligou. O Modo calmo desliga tudo.
- **Voz:** com "Ler a pergunta em voz alta" ligado, a pergunta é lida ao abrir e aparece o
  botão "Ouvir a pergunta" (isso NÃO conta como ajuda no perfil).
- **Limite:** vibração só funciona em Android; no iPhone o app depende de som e tela.

## Fase 3 — Lições, resultado e XP (branch `melhorias-fase-3`)

- **Lições:** cada matéria é uma lição de 3 perguntas (entraram 3 perguntas novas: desconto, mas/mais
  e fotossíntese — **revisar conteúdo com o professor**). A pergunta mostra "Pergunta 2 de 3" e uma barra.
- **Resultado:** ao acertar, aparece o painel "Muito bem!" com o XP ganho e o botão **Continuar**.
  Nada avança sozinho e não há cronômetro (importante para quem precisa de mais tempo).
- **XP só sobe:** 10 por acerto de primeira, 5 depois de errar ou pedir ajuda, +20 ao fechar a lição.
  Não há vidas nem perda de pontos. O Modo calmo esconde o XP.

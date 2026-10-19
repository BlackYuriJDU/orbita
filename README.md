# ÓRBITA

**A escola inclui o aluno. O ÓRBITA adapta o caminho.**

Sistema web que **não muda o objetivo da tarefa — muda o caminho para chegar nele**.
O aluno trava, toca "Está difícil", escolhe *como* quer ajuda, e a mesma questão volta na
representação escolhida: mais simples · exemplo · em passos · ouvir.

- 🌐 **Site ao vivo (GitHub Pages):** https://blackyurijdu.github.io/orbita/
- 🧪 **Testes:** `node teste-sinal.js` (a contagem aparece no final) · [![Testes do ÓRBITA](https://github.com/BlackYuriJDU/orbita/actions/workflows/testes-orbita.yml/badge.svg)](https://github.com/BlackYuriJDU/orbita/actions/workflows/testes-orbita.yml)

MVP da **Maratona Dev Impacto** (CESAR School / Florescendo Talentos).

## Como rodar

Sem build, sem dependência, sem servidor:

```bash
start site/index.html        # Windows: abre no navegador
# ou simplesmente abra site/index.html
```

O teste roda o app de verdade (o `app.js` inteiro) num DOM falso:

```bash
cd site
node teste-sinal.js
```

## Estrutura

```
site/               o sistema (HTML, CSS e JS clássicos — funciona em file://)
  seed.js           conteúdo: 9 itens × 4 representações autorais
  app.js            lógica: estado, laço de ajuda, perfil derivado
  index.html        as telas e o boneco
  style.css         a folha de estilo, com o motivo de cada decisão
  efeitos.js        sons sintetizados e comemoração (sem arquivo e sem rede)
  teste-sinal.js    a prova de que a tese do projeto funciona
.github/            CI (testes em todo push/PR) e deploy automático do Pages
```

**Documentação completa** — decisões de projeto, acessibilidade, contraste, transparência no
uso de IA: [`site/README.md`](site/README.md).

## Licença

[MIT](LICENSE) — use, estude e adapte, mantendo o aviso de copyright.

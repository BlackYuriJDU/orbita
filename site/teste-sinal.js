/* Teste do sinal — o coração do projeto, verificado sem navegador.
   Rodar:  node teste-sinal.js

   Por que este arquivo existe
   O perfil derivado é a tese do Órbita: "esta representação funcionou com
   este aluno". Se essa conta estiver errada, o projeto inteiro está errado —
   e o erro é silencioso, porque a tela continua mostrando alguma coisa.

   Um teste de tela não pegaria esse bug. Este pega.

   O QUE ESTÁ SENDO TESTADO (o caminho que a câmera mostra):
     1. aluno responde ERRADO sem pedir ajuda   → não conta como sinal
     2. ele toca "Está difícil" e pede "passos"
     3. ele responde CERTO de primeira com a ajuda na tela → sinal forte
     4. o perfil diz que "passos" funcionou, em Matemática

   E o contra-teste, que é o que a maioria dos projetos erra:
     5. se ele erra DEPOIS da ajuda, o acerto NÃO é sinal — porque aí foi
        a insistência dele, não a representação. */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* Um DOM falso, só com o suficiente para rodar o app de verdade.
   Não é uma simulação do app — é o app, rodando sobre elementos falsos. */

function elementoFalso() {
  const el = {
    tagName: 'DIV',
    className: '',
    innerHTML: '',
    textContent: '',
    hidden: false,
    checked: false,
    value: '',
    style: {},
    filhos: [],
    appendChild(filho) { this.filhos.push(filho); return filho; },
    addEventListener() {},
    click() { if (this.aoClicar) this.aoClicar(); },
  };
  return el;
}

const elementos = {};
function getElementById(id) {
  if (!elementos[id]) elementos[id] = elementoFalso();
  return elementos[id];
}

const armazenamento = {
  dados: {},
  getItem(k) { return this.dados[k] === undefined ? null : this.dados[k]; },
  setItem(k, v) { this.dados[k] = String(v); },
};

const contexto = {
  console,
  document: {
    getElementById,
    createElement: () => elementoFalso(),
    addEventListener() {},        // não dispara o bootstrap; testamos por unidade
    body: { classList: { toggle() {} } },
  },
  window: {
    scrollTo() {},
    speechSynthesis: undefined,   // sem voz: forçamos o caminho do fallback
  },
  localStorage: armazenamento,
  // navigator existe mas sem vibrate: exercita a guarda da vibração, que
  // precisa devolver sem erro em máquina e navegador que não têm o recurso.
  navigator: {},
  Date, Math, JSON, Blob: function () {}, URL: { createObjectURL: () => '', revokeObjectURL() {} },
  setTimeout, confirm: () => false,
};
contexto.window.localStorage = armazenamento;
vm.createContext(contexto);

/* Carrega os dois arquivos no MESMO contexto — é assim que o navegador faz. */
const aqui = __dirname;
vm.runInContext(fs.readFileSync(path.join(aqui, 'seed.js'), 'utf8'), contexto, { filename: 'seed.js' });
vm.runInContext(fs.readFileSync(path.join(aqui, 'app.js'), 'utf8'), contexto, { filename: 'app.js' });

/* Roda um trecho dentro do contexto, onde as funções do app existem. */
function noApp(codigo) {
  return vm.runInContext(codigo, contexto);
}

/* Mini-framework de verificação */

let passou = 0, falhou = 0;
function conferir(descricao, condicao, detalhe) {
  if (condicao) {
    passou++;
    console.log('  ok   ' + descricao);
  } else {
    falhou++;
    console.log('  FALHA ' + descricao + (detalhe ? '\n         -> ' + detalhe : ''));
  }
}

/* --- O TESTE --- */

console.log('\nÓRBITA — teste do sinal de "funcionou"\n');

noApp(`
  // Estado de aluno novo: primeiro uso.
  dados = { versao: 1, modoCalmo: false, itens: montarRotina(), tentativas: [] };
  sessao = null;
`);

/* --- 0. a rotina nasce do conteúdo, não do storage --- */
noApp('abrirItem(ITENS[0].id);');   // item 0 = fração da pizza (Matemática)
conferir('a rotina foi montada a partir do conteúdo (6 itens)',
  noApp('dados.itens.length') === 6,
  'veio ' + noApp('dados.itens.length'));

/* --- 1. erra SEM ajuda --- */
noApp('respondeu(false);');   // gabarito é 0; respondendo false = errou

const primeira = noApp('dados.tentativas[0]');
conferir('1. o erro sem ajuda foi registrado no log',
  !!primeira && primeira.acertou === false,
  JSON.stringify(primeira));
conferir('1. e ele NÃO é sinal forte (acertou = false)',
  !!primeira && primeira.acertou === false);

/* --- 2. pede ajuda: "passos" --- */
noApp('escolherAjuda("passos");');
conferir('2. a ajuda "passos" ficou ativa na tela',
  noApp('sessao.ajudaAtiva') === 'passos');

/* --- 3. acerta de primeira COM a ajuda na tela --- */
noApp('respondeu(true);');

const segunda = noApp('dados.tentativas[1]');
conferir('3. o acerto foi registrado',
  !!segunda && segunda.acertou === true);
conferir('3. tentativasAteAcertar === 1  (o sinal mais forte)',
  !!segunda && segunda.tentativasAteAcertar === 1,
  'veio ' + (segunda && segunda.tentativasAteAcertar) + ' — se for 2, o contador está contando o erro ANTES da ajuda');
conferir('3. a ajuda registrada é a que de fato levou à resposta',
  !!segunda && segunda.ajudaUsada === 'passos',
  'veio ' + (segunda && segunda.ajudaUsada));

/* --- 4. o perfil reflete o sinal --- */
const perfil = noApp('derivarPerfil()');
conferir('4. o perfil diz que "passos" funcionou em Matemática',
  perfil.melhorPorMateria.matematica === 'passos',
  JSON.stringify(perfil.melhorPorMateria));
conferir('4. e conta 1 acerto de primeira sob "passos"',
  perfil.acertos.passos && perfil.acertos.passos.dentro === 1,
  JSON.stringify(perfil.acertos));

/* --- 5. CONTRA-TESTE: errar DEPOIS da ajuda não gera sinal --- */
noApp(`
  abrirItem(ITENS[1].id);          // proporção do bolo, também Matemática
  escolherAjuda('passos');
  respondeu(false);                // errou COM a ajuda na tela
  respondeu(true);                 // e só então acertou
`);

const terceira = noApp('dados.tentativas[2]');   // o erro com ajuda
const quarta = noApp('dados.tentativas[3]');    // o acerto depois do erro

conferir('5. o erro COM ajuda também é registrado',
  !!terceira && terceira.acertou === false);
conferir('5. o acerto seguinte NÃO é sinal forte (tentativasAteAcertar > 1)',
  !!quarta && quarta.acertou === true && quarta.tentativasAteAcertar === 2,
  'veio ' + (quarta && quarta.tentativasAteAcertar) + ' — se for 1, o perfil está premiando insistência');

const perfilFinal = noApp('derivarPerfil()');
conferir('5. por isso "passos" continua com exatamente 1 sinal, não 2',
  perfilFinal.acertos.passos.dentro === 1,
  JSON.stringify(perfilFinal.acertos.passos));

/* --- 6. o CONTENT nunca entra no estado do aluno --- */
const chaves = noApp('Object.keys(dados).sort().join(",")');
conferir('6. o estado do aluno não carrega o conteúdo (só referências)',
  chaves === 'itens,modoCalmo,tentativas,versao',
  'chaves: ' + chaves);

/* --- 7. a escalada: "ainda não entendi" sobe para "passos" --- */
const escalou = noApp(`
  abrirItem(ITENS[3].id);
  escolherAjuda('exemplo');
  naoEntendi();
  sessao.ajudaAtiva;
`);
conferir('7. "Ainda não entendi" sobe um degrau (de "exemplo" para "passos")',
  escalou === 'passos',
  'veio ' + escalou);

/* --- 8. "naoEntendi" nunca entra no perfil como representação --- */
conferir('8. o log só guarda a representação que levou à resposta',
  noApp('dados.tentativas.every(t => t.ajudaUsada !== "naoEntendi")'),
  'o escalonamento apareceu como se fosse uma representação');

/* --- 9. a escada de degraus é uma escada de verdade --- */
/* Subir de degrau precisa ir UM degrau acima, senão "Ainda não entendi" é
   só um atalho para "passos" com nome de escada. E o topo não pode passar
   dele mesmo: pedir de novo tem de ser um no-op, não um salto. */
conferir('9. de "mais simples" sobe para "exemplo" (um degrau, não dois)',
  noApp('proximoDegrau("maisSimples")') === 'exemplo',
  'veio ' + noApp('proximoDegrau("maisSimples")'));
conferir('9. de "exemplo" sobe para "passos"',
  noApp('proximoDegrau("exemplo")') === 'passos');
conferir('9. do topo ("passos") não passa de "passos"',
  noApp('proximoDegrau("passos")') === 'passos');
conferir('9. "ouvir" não é degrau do caminho escrito: cai no mais concreto',
  noApp('proximoDegrau("ouvir")') === 'passos');
conferir('9. pedir ajuda antes de escolher qualquer uma também cai no topo',
  noApp('proximoDegrau(null)') === 'passos');

/* --- 10. a vibração nunca é o único retorno, e some no Modo Calmo --- */
conferir('10. vibrar() devolve sem erro onde não há o recurso (bônus, não base)',
  noApp('(function(){ vibrar(10); return true; })()') === true);
conferir('10. e não vibra quando o aluno pediu o Modo Calmo',
  noApp(`
    dados.modoCalmo = true;
    let sentiu = false;
    navigator.vibrate = function () { sentiu = true; };
    vibrar([18, 45, 18]);
    delete navigator.vibrate;
    dados.modoCalmo = false;
    sentiu;
  `) === false,
  'o aparelho ainda vibrou com o Modo Calmo ligado');

/* --- Resultado --- */

console.log('\n' + '-'.repeat(58));
if (falhou === 0) {
  console.log('  ' + passou + ' verificações passaram. A tese do projeto está de pé.');
} else {
  console.log('  ' + passou + ' passaram, ' + falhou + ' FALHARAM.');
}
console.log('-'.repeat(58) + '\n');

process.exit(falhou === 0 ? 0 : 1);
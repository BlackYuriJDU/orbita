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
    // O navegador tem classList; o stub anterior não, e isso escondeu um bug:
    // renderRotina() nunca era chamado no caminho testado, então o erro
    // aparecia só no navegador. Add é o que a app usa.
    setAttribute() {}, focus() {},
    classList: {
      _classes: new Set(),
      toggle(c, on) { if (on) this._classes.add(c); else this._classes.delete(c); },
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
    },
    appendChild(filho) { this.filhos.push(filho); return filho; },
    addEventListener() {},
    click() { if (this.aoClicar) this.aoClicar(); },
  };

  // No DOM de verdade, innerHTML = '' destrói os filhos. O stub precisa fazer
  // o mesmo: sem isso, os filhos de todos os renders se acumulam e a contagem
  // mente — foi o que deixou as duas verificações de tela passarem errado.
  let htmlInterno = '';
  Object.defineProperty(el, 'innerHTML', {
    get() { return htmlInterno; },
    set(v) { htmlInterno = v; if (v === '') el.filhos.length = 0; },
  });

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
    querySelector: () => null,
    querySelectorAll: () => [],
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
conferir('a rotina foi montada a partir do conteúdo (9 itens)',
  noApp('dados.itens.length') === 9,
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
  chaves === 'itens,modoCalmo,tentativas,versao,xp',
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

/* --- 11. abrir um item DESPENHA a tela da tarefa --------------------------- */
/* Bug real, encontrado abrindo no navegador depois: abrirItem() trocava a tela
   mas não chamava renderTarefa(). O aluno via só os botões que já vivem no
   HTML — "Está difícil" e "Voltar" — com enunciado e alternativas vazios.
   Voltavam a aparecer depois de pedir ajuda, porque escolherAjuda() chama
   renderTarefa(). Este teste existe para o bug não voltar. */
noApp(`
  dados = { versao: 1, modoCalmo: false, itens: montarRotina(), tentativas: [] };
  sessao = null;
  abrirItem(ITENS[0].id);
`);
const enunciadoNaTela = noApp('pegar("txt-enunciado").textContent');
conferir('11. abrir o item escreve o enunciado na tela',
  enunciadoNaTela === noApp('ITENS[0].enunciado'),
  'veio ' + JSON.stringify(enunciadoNaTela));
conferir('11. e monta uma alternativa por opção do item',
  noApp('pegar("alternativas").filhos.length') === noApp('ITENS[0].opcoes.length'),
  'veio ' + noApp('pegar("alternativas").filhos.length'));
conferir('11. o enunciado não é o vazio que ficava na tela',
  enunciadoNaTela.length > 20);

/* --- 12. acertar REDESENHA a rotina ---------------------------------------- */
/* O segundo bug do mesmo tipo: ao acertar, o app voltava para a rotina sem
   chamar renderRotina(). O item não saía de "AGORA", a barra não andava, e
   para o aluno parecia que nada tinha acontecido. */
const itensNaRotina = noApp('dados.itens.length');
/* Depois do acerto o aluno fica na pergunta e toca em Continuar, que redesenha a
   rotina. Aqui chamamos renderRotina() direto; o botão é exercitado no teste de tela. */
noApp('abrirItem(ITENS[0].id); respondeu(true); renderRotina();');
conferir('12. ao acertar, o item fica concluído no estado',
  noApp('dados.itens[0].concluido') === true);
conferir('12. e recebe a classe "feito" na tela',
  noApp('pegar("lista-rotina").filhos[0].filhos[0].classList.contains("feito")') === true,
  'classes: ' + noApp('JSON.stringify([...pegar("lista-rotina").filhos[0].filhos[0].classList._classes])'));
conferir('12. e a rotina continua com todos os itens, nenhum sumiu',
  noApp('pegar("lista-rotina").filhos.length') === itensNaRotina,
  'era ' + itensNaRotina + ', veio ' + noApp('pegar("lista-rotina").filhos.length'));

/* --- 13. o nome do aluno ------------------------------------------------- */
/* O nome é o único dado que o aluno DIGITA, e é o único que não vai para o
   registro exportado. Os dois são decisões, não accidents — por isso são
   testados. O teste de marcação existe porque um nome com "<" escrito via
   innerHTML viraria tag: o textoContent na tela é a prova de que não. */
conferir('13. sem nome salvo, nada é lido do armazenamento',
  noApp('nomeSalvo()') === '');

noApp('salvarNome("  Maria  ");');
conferir('13. o nome salvo volta sem os espaços que o aluno digitou',
  noApp('nomeSalvo()') === 'Maria',
  'veio ' + JSON.stringify(noApp('nomeSalvo()')));

noApp('renderNome();');
const saudacao = noApp('pegar("saudacao").textContent');
conferir('13. a saudação chama o aluno pelo nome',
  saudacao.indexOf('Maria') !== -1,
  'veio ' + JSON.stringify(saudacao));

/* "Bom dia" às 22h é o tipo de erro que a tela mostra sem o app quebrar. */
const hora = new Date().getHours();
const parteDoDia = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
conferir('13. a saudação usa o período certo do dia',
  saudacao.indexOf(parteDoDia) === 0,
  'esperava "' + parteDoDia + '", veio ' + JSON.stringify(saudacao));

conferir('13. o nome NÃO entra no registro do aluno (o log baixado fica anônimo)',
  noApp('JSON.stringify(dados).indexOf("Maria")') === -1);

noApp('salvarNome("<b>Ana</b>"); renderNome();');
conferir('13. um nome com marcação aparece como texto, não como HTML',
  noApp('pegar("saudacao").textContent').indexOf('<b>Ana</b>') !== -1,
  'o nome foi interpretado como tag — a saudação está usando innerHTML');

/* --- Resultado --- */


/* --- Fase 1: conteúdo e rótulos ------------------------------------------ */
console.log('\nConteúdo e rotina\n');
const pos = noApp('ITENS.map(i => i.gabarito)');
conferir('14. a resposta certa não fica sempre na mesma posição', new Set(pos).size > 1, 'posições: ' + pos);
conferir('14. todo gabarito aponta para uma opção que existe', noApp('ITENS.every(i => i.opcoes[i.gabarito] !== undefined)'));
conferir('14. nenhuma opção repetida dentro do mesmo item', noApp('ITENS.every(i => new Set(i.opcoes).size === i.opcoes.length)'));
const textoTodo = noApp('JSON.stringify(ITENS)');
conferir('15. sem inglês perdido no texto (accompany)', !textoTodo.includes('accompany'));
conferir('15. a regra de faz/fazem não diz "plural"', !noApp('JSON.stringify(ITENS.find(i => i.id === "por-faz-tres-anos"))').includes('plural'));
noApp('renderRotina()');
const rotulos = noApp('pegar("lista-rotina").filhos').map((li) => li.filhos[0].innerHTML);
const agora = noApp('indiceDoItemAtual()');
conferir('16. só o item atual é marcado AGORA', rotulos.filter((h) => h.includes('AGORA')).length === 1 && rotulos[agora].includes('AGORA'), JSON.stringify(rotulos.map((h) => h.slice(0, 80))));
conferir('16. item concluído aparece como FEITO', noApp('dados.itens').every((it, i) => !it.concluido || rotulos[i].includes('FEITO')));
conferir('17. falar() devolve false sem speechSynthesis (cai no texto)', noApp('falar("oi")') === false);

console.log('\nMeus sentidos\n');
const PADRAO = '{ som: true, vibracao: true, voz: false, festa: true }';
noApp('dados.modoCalmo = false; dados.sentidos = ' + PADRAO);
conferir('18. sentido() respeita o painel', noApp('sentido("som")') === true && noApp('sentido("voz")') === false);
noApp('dados.modoCalmo = true');
conferir('18. o Modo calmo desliga todos os sentidos', ['som', 'vibracao', 'voz', 'festa'].every((n) => noApp('sentido("' + n + '")') === false));
noApp('dados.modoCalmo = false; dados.sentidos = undefined');
conferir('19. dados antigos sem "sentidos" não quebram', noApp('som("acerto"); festa(); vibrar(10); sentido("som")') === false);
noApp('dados.sentidos = ' + PADRAO);

console.log('\nLições e XP\n');
conferir('20. XP: acerto de primeira vale 10; depois de errar, 5 (nunca menos)', noApp('xpDoAcerto(0)') === 10 && noApp('xpDoAcerto(1)') === 5 && noApp('xpDoAcerto(9)') === 5);
conferir('20. cada matéria tem 3 perguntas (lição)', noApp('["matematica","portugues","ciencias"].every(m => ITENS.filter(i => i.materia === m).length === 3)'));
noApp('dados.itens = montarRotina(); dados.xp = 0; dados.modoCalmo = false');
noApp('abrirItem("mat-fracao-pizza"); respondeu(false); respondeu(true)');
conferir('21. errar antes de acertar: +5 XP', noApp('dados.xp') === 5, noApp('dados.xp'));
conferir('21. depois de acertar a tela fica na pergunta com o resultado (não avança sozinha)', noApp('sessao !== null && sessao.resultado.ganho') === 5);
noApp('abrirItem("mat-proporcao-bolo"); respondeu(true)');
conferir('21. acerto de primeira: +10 XP', noApp('dados.xp') === 15, noApp('dados.xp'));
conferir('21. lição ainda aberta: sem bônus', noApp('sessao.resultado.licao') === null);
noApp('abrirItem("mat-desconto-camiseta"); respondeu(true)');
conferir('21. fechar a lição: +10 +20 de bônus', noApp('dados.xp') === 45 && noApp('sessao.resultado.licao.materia') === 'matematica', noApp('dados.xp'));
const xpAntes = noApp('dados.xp');
noApp('abrirItem("por-aviso-celular"); respondeu(false); respondeu(false); respondeu(false)');
conferir('22. errar nunca tira XP', noApp('dados.xp') === xpAntes);
noApp('dados.itens = montarRotina(); dados.xp = 0; sessao = null');

console.log('\n' + '-'.repeat(58));
if (falhou === 0) {
  console.log('  ' + passou + ' verificações passaram. A tese do projeto está de pé.');
} else {
  console.log('  ' + passou + ' passaram, ' + falhou + ' FALHARAM.');
}
console.log('-'.repeat(58) + '\n');

process.exit(falhou === 0 ? 0 : 1);
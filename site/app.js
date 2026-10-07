/* O conteúdo (os enunciados) está em seed.js. Aqui só mecânica. Um bug de
   texto jamais pode apagar o histórico de um aluno. */

const CHAVE = 'orbita.dados.v1';
const CHAVE_BAK = 'orbita.dados.v1.bak';

/* O nome do aluno mora NUMA CHAVE SEPARADA, e isso é deliberado. `dados` é o que
   o app exporta em "Baixar meu registro" — se o nome estivesse junto, o arquivo
   baixado levaria o nome do aluno. Aqui o histórico fica anônimo. */
const CHAVE_NOME = 'orbita.nome.v1';

/* Estado do aluno. É isto que é salvo. */
let dados = {
  versao: 1,
  modoCalmo: false,
  itens: [],      // a rotina de hoje: { itemId, concluido }
  tentativas: [], // o log. Só cresce, nunca é reescrito.
};

/* Estado da sessão — o que está acontecendo AGORA na tela. Isto NÃO é salvo.
   Se a página recarregar no meio de uma questão, o aluno volta para o começo
   da questão. É o comportamento certo: recomeçar uma questão é melhor do que
   recomeçar o dia. */
let sessao = null;

/* Quando o navegador bloqueia o localStorage (modo privado, cota cheia), o app
   continua funcionando em memória. Perde só a persistência — nunca abre
   quebrado. */
let semGravacao = false;

function pegar(id) { return document.getElementById(id); }

/* Retorno tátil, para quem sente vibração (Android). Nunca é o único retorno:
   toda ação aqui já muda a tela visivelmente, e no Modo Calmo some também. */
function vibrar(padrao) {
  if (dados.modoCalmo) return;
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(padrao);
}

function carregarDados() {
  for (const chave of [CHAVE, CHAVE_BAK]) {
    let texto = null;
    try {
      texto = localStorage.getItem(chave);
    } catch (e) {
      semGravacao = true; // navegador bloqueou o acesso
      return;
    }
    if (!texto) continue;
    try {
      const lido = JSON.parse(texto);
      if (lido && lido.itens) return lido; // o que veio inteiro vence
    } catch (e) {
      /* JSON quebrado: tenta a próxima chave. Nunca apaga o aluno por causa
         de um arquivo corrompido — no máximo perde o último save. */
    }
  }
  return null;
}

/* Duas chaves, não uma. A segunda é o plano de segurança: se a primeira estiver
   truncada (o navegador caiu no meio da escrita), ainda existe uma cópia
   inteira da anterior. */
function salvarDados() {
  if (semGravacao) return;
  try {
    const texto = JSON.stringify(dados, null, 2);
    const anterior = localStorage.getItem(CHAVE);
    if (anterior) localStorage.setItem(CHAVE_BAK, anterior);
    localStorage.setItem(CHAVE, texto);
  } catch (e) {
    semGravacao = true; // cota estourada ou modo privado
  }
}

/* A escada do escalonamento. 'ouvir' não está nela: não é um degrau do
   caminho escrito, então um pedido para subir cai direto no mais concreto. */
const DEGRAUS = ['maisSimples', 'exemplo', 'passos'];

function proximoDegrau(atual) {
  const i = DEGRAUS.indexOf(atual);
  if (i === -1 || i === DEGRAUS.length - 1) return 'passos';
  return DEGRAUS[i + 1];
}

function ajudaPorId(id) { return AJUDAS.find((a) => a.id === id); }

function itemPorId(id) { return ITENS.find((i) => i.id === id); }

/* A rotina de hoje é a lista de itens, na ordem. Ela nasce do CONTEÚDO
   (seed.js), nunca do armazenamento — assim o dia começa igual para todo
   mundo, e o histórico do aluno nunca é confundido com a lista de tarefas. */
function montarRotina() {
  return ITENS.map((item) => ({ itemId: item.id, concluido: false }));
}

/* O índice do primeiro item ainda não concluído — o único com peso visual
   forte na tela. Se todos acabaram, o índice vira o tamanho da lista e nenhum
   item recebe a marca de "AGORA". */
function indiceDoItemAtual() {
  const idx = dados.itens.findIndex((it) => !it.concluido);
  return idx === -1 ? dados.itens.length : idx;
}

function progresso() {
  if (!dados.itens.length) return 0;
  const feitos = dados.itens.filter((it) => it.concluido).length;
  return feitos / dados.itens.length;
}

/* O perfil é CALCULADO a cada leitura, NUNCA salvo. Duas fontes de verdade
   para a mesma informação é um bug esperando acontecer — e um bug silencioso:
   a tela continua mostrando alguma coisa, só que errada.

   Só conta como "funcionou" a tentativa em que o aluno ACERTOU DE PRIMEIRA
   depois de pedir ajuda (tentativasAteAcertar === 1). Acertar na terceira
   tentativa não diz que a representação funcionou — diz que ele insistiu. */
function derivarPerfil() {
  const acertos = {};   // ajuda -> { dentro: n, total: n }
  const porMateria = {}; // materia -> { ajuda: n }

  for (const t of dados.tentativas) {
    const ajuda = t.ajudaUsada;
    if (!ajuda) continue; // acertou sem pedir ajuda nenhuma
    if (!acertos[ajuda]) acertos[ajuda] = { dentro: 0, total: 0 };
    acertos[ajuda].total++;
    if (t.acertou && t.tentativasAteAcertar === 1) {
      acertos[ajuda].dentro++;
      porMateria[t.materia] = porMateria[t.materia] || {};
      porMateria[t.materia][ajuda] = (porMateria[t.materia][ajuda] || 0) + 1;
    }
  }

  // Para cada matéria, qual foi a ajuda com mais acertos de primeira.
  const melhorPorMateria = {};
  for (const materia in porMateria) {
    let melhor = null, qtd = -1;
    for (const ajuda in porMateria[materia]) {
      if (porMateria[materia][ajuda] > qtd) { qtd = porMateria[materia][ajuda]; melhor = ajuda; }
    }
    melhorPorMateria[materia] = melhor;
  }

  let maisUsada = null, maxUsos = -1;
  for (const ajuda in acertos) {
    if (acertos[ajuda].total > maxUsos) { maxUsos = acertos[ajuda].total; maisUsada = ajuda; }
  }

  return { acertos, melhorPorMateria, maisUsada, total: dados.tentativas.length };
}

/* O laço de ajuda. O aluno trava; a tela NÃO mostra um X vermelho nem apita.
   Ela diz "Quase! Vamos ver juntos?" — porque o objetivo aqui não é medir o
   erro, é devolver o aluno à tarefa. Ele toca "Está difícil", o sistema
   pergunta COMO ele quer ajuda, e a MESMA questão volta na representação
   escolhida. O objetivo não muda. */
function abrirItem(itemId) {
  const item = itemPorId(itemId);
  if (!item) return;
  sessao = {
    itemId: itemId,
    erros: 0,          // quantas vezes errou NESTA tentativa de resolver
    ajudaAtiva: null,  // qual representação está na tela
    passoAtual: 0,     // até onde os passos foram revelados
    inicio: Date.now(),
    respondendo: false,
  };
  mostrar('tarefa');
  renderTarefa();
}

/* Errou. A resposta é sempre acolhedora, nunca corretiva. E o aluno continua
   no comando: o sistema NÃO troca a representação por conta própria — quem
   sobe o degrau é ele, tocando "Ainda não entendi". */
function errou() {
  if (!sessao || sessao.respondendo) return;
  sessao.respostaErrada = true;

  /* Só conta o erro que aconteceu COM a ajuda na tela. O contador existe para
     responder uma pergunta precisa: "depois de pedir ajuda, quantas vezes ele
     precisou até acertar?" — quando o resultado é 1, a representação funcionou
     de primeira, que é o sinal mais forte que temos. */
  if (sessao.ajudaAtiva) sessao.erros++;
  vibrar(12);
  renderTarefa();
}

function mostrarAjuda() {
  if (!sessao) return;
  sessao.respostaErrada = false;
  vibrar(8);
  mostrar('ajuda');
  renderAjuda();
}

/* "Ainda não entendi" não escolhe representação — sobe o degrau. */
function naoEntendi() {
  if (!sessao) return;
  sessao.ajudaAtiva = proximoDegrau(sessao.ajudaAtiva);
  sessao.passoAtual = 0;
  vibrar([10, 50, 10]);
  mostrar('tarefa');
  renderTarefa();
}

function escolherAjuda(ajudaId) {
  if (!sessao) return;
  sessao.ajudaAtiva = ajudaId;
  sessao.passoAtual = 0;
  sessao.respostaErrada = false;
  vibrar(8);
  mostrar('tarefa');
  renderTarefa();
}

/* Revelar mais um passo. Um de cada vez — mostrar os 3 de uma vez é o mesmo
   que mostrar o enunciado sozinho. */
function proximoPasso() {
  if (!sessao) return;
  sessao.passoAtual++;
  vibrar(10);
  renderTarefa();
}

function respondeu(correta) {
  if (!sessao || sessao.respondendo) return;
  sessao.respondendo = true;
  const item = itemPorId(sessao.itemId);

  dados.tentativas.push({
    id: 't' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    itemId: sessao.itemId,
    materia: item.materia,
    acertou: correta,
    tentativasAteAcertar: sessao.erros + 1,
    duracaoMs: Date.now() - sessao.inicio,
    em: new Date().toISOString(),
    // 'naoEntendi' NÃO entra aqui como ajuda — se entrou, foi escalonamento
    // e a representação que de fato levou à resposta está em sessao.ajudaAtiva.
    ajudaUsada: sessao.ajudaAtiva,
  });

  if (correta) {
    const it = dados.itens.find((x) => x.itemId === sessao.itemId);
    if (it) it.concluido = true;
    salvarDados();
    sessao = null;
    vibrar([18, 45, 18]);
    mostrar('rotina');
    renderRotina();
    return;
  }

  salvarDados();
  sessao.respondendo = false;
  errou(); // conta o erro e mostra o acolhimento
}

/* A representação "ouvir" usa a voz do navegador. Se não houver voz em
   português na máquina, NÃO trava: mostra o texto grande e legível, que é a
   mesma informação por outro caminho. Na demonstração isso é somado, nunca
   subtraído. */
function falar(texto) {
  if (!('speechSynthesis' in window)) return false;
  const voz = (window.speechSynthesis.getVoices() || [])
    .find((v) => v.lang && v.lang.toLowerCase().startsWith('pt'));
  if (!voz) return false;
  window.speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = voz.lang;
  fala.voice = voz;
  window.speechSynthesis.speak(fala);
  return true;
}

function mostrar(tela) {
  for (const nome of ['nome', 'rotina', 'tarefa', 'ajuda', 'perfil']) {
    const secao = pegar('tela-' + nome);
    if (secao) secao.hidden = nome !== tela;
  }
  window.scrollTo(0, 0);
}

function aplicarModoCalmo() {
  document.body.classList.toggle('modo-calmo', dados.modoCalmo);
}

function renderProgresso() {
  const barra = pegar('barra-progresso');
  const pct = Math.round(progresso() * 100);
  barra.style.width = pct + '%';
  pegar('txt-progresso').textContent = pct + '%';
}

/* O rótulo de quando. O item 0 é o AGORA; o resto é agenda, e a agenda não
   precisa ser precisa para o aluno. */
const QUANDO = ['AGORA', 'DEPOIS', 'MAIS TARDE'];

function renderRotina() {
  const lista = pegar('lista-rotina');
  lista.innerHTML = '';
  const idxAtual = indiceDoItemAtual();

  dados.itens.forEach((it, idx) => {
    const item = itemPorId(it.itemId);
    if (!item) return;

    const ehAgora = idx === idxAtual && !it.concluido;

    const linha = document.createElement('button');
    linha.className = 'item-rotina';
    if (it.concluido) linha.classList.add('feito');
    else if (ehAgora) linha.classList.add('agora');

    const marca = it.concluido ? '✓' : ehAgora ? '▶' : '○';
    const quando = QUANDO[idx] || 'DEPOIS';
    linha.innerHTML =
      '<span class="marca">' + marca + '</span>' +
      '<span class="item-texto">' +
      '<span class="item-quando">' + quando + '</span>' +
      '<span class="item-materia">' + MATERIAS[item.materia] + '</span>' +
      '</span>';

    if (!it.concluido) {
      linha.addEventListener('click', () => abrirItem(it.itemId));
    }
    lista.appendChild(linha);
  });

  renderProgresso();
}

function renderTarefa() {
  if (!sessao) return;
  const item = itemPorId(sessao.itemId);
  if (!item) return;

  pegar('txt-materia').textContent = MATERIAS[item.materia];
  pegar('txt-enunciado').textContent = item.enunciado;

  const caixa = pegar('alternativas');
  caixa.innerHTML = '';
  item.opcoes.forEach((opcao, idx) => {
    const botao = document.createElement('button');
    botao.className = 'alternativa';
    botao.textContent = opcao;
    botao.addEventListener('click', () => respondeu(idx === item.gabarito));
    caixa.appendChild(botao);
  });

  const erro = pegar('msg-erro');
  if (sessao.respostaErrada) {
    erro.textContent = 'Quase! Vamos ver juntos?';
    erro.hidden = false;
  } else {
    erro.hidden = true;
  }

  /* "Ainda não entendi" só faz sentido depois de entrar em um degrau: não se
     pede para subir antes de ter começado. */
  pegar('btn-nao-entendi').hidden = !sessao.ajudaAtiva;

  const painel = pegar('painel-ajuda');
  painel.innerHTML = '';

  if (sessao.ajudaAtiva) {
    painel.hidden = false;
    painel.appendChild(ajudaAtivaHTML(item));
  } else {
    painel.hidden = true;
  }
}

/* A MESMA questão está logo acima — só muda a forma de chegar nela. */
function ajudaAtivaHTML(item) {
  const conteudo = document.createElement('div');
  conteudo.className = 'ajuda-conteudo';

  if (sessao.ajudaAtiva === 'maisSimples') {
    conteudo.innerHTML = '<p class="ajuda-titulo">Mais simples</p><p>' + item.maisSimples + '</p>';
    return conteudo;
  }

  if (sessao.ajudaAtiva === 'exemplo') {
    conteudo.innerHTML = '<p class="ajuda-titulo">Um exemplo parecido</p><p>' + item.exemplo + '</p>';
    return conteudo;
  }

  if (sessao.ajudaAtiva === 'passos') {
    conteudo.innerHTML = '<p class="ajuda-titulo">Em passos</p>';
    const ol = document.createElement('ol');
    ol.className = 'passos';
    item.passos.forEach((passo, i) => {
      const li = document.createElement('li');
      if (i < sessao.passoAtual) {
        li.textContent = passo;
        li.className = 'passo-visivel';
      }
      ol.appendChild(li);
    });
    conteudo.appendChild(ol);

    if (sessao.passoAtual < item.passos.length) {
      const botao = document.createElement('button');
      botao.className = 'btn-ajuda btn-secundario';
      botao.textContent = sessao.passoAtual === 0 ? 'Ver o primeiro passo' : 'Ver mais um passo';
      botao.addEventListener('click', proximoPasso);
      conteudo.appendChild(botao);
    } else {
      const aviso = document.createElement('p');
      aviso.className = 'passo-fim';
      aviso.textContent = 'Esse é o caminho todo. Tenta responder agora.';
      conteudo.appendChild(aviso);
    }
    return conteudo;
  }

  if (sessao.ajudaAtiva === 'ouvir') {
    conteudo.innerHTML = '<p class="ajuda-titulo">Ouvindo</p>';
    const botao = document.createElement('button');
    botao.className = 'btn-ajuda';
    botao.textContent = 'Ouvir o enunciado';
    botao.addEventListener('click', () => {
      const deu = falar(item.enunciado);
      vibrar(deu ? 10 : [10, 60, 10]);
      if (!deu) {
        conteudo.innerHTML += '<p class="aviso-sem-voz">Este aparelho não tem voz em português instalada. ' +
          'O enunciado está escrito acima — leia em voz alta.</p>';
      }
    });
    conteudo.appendChild(botao);
    return conteudo;
  }

  return conteudo;
}

function renderAjuda() {
  const lista = pegar('lista-ajudas');
  lista.innerHTML = '';
  for (const ajuda of AJUDAS) {
    const item = sessao ? itemPorId(sessao.itemId) : null;
    // 'ouvir' sempre existe; as de texto só se o item as tem.
    if (item && ajuda.id !== 'ouvir' && ajuda.id !== 'naoEntendi' && !itemTemAjuda(item, ajuda.id)) continue;

    const botao = document.createElement('button');
    botao.className = 'btn-ajuda';
    if (ajuda.escalonamento) botao.classList.add('btn-escalonar');
    botao.textContent = ajuda.rotulo;
    botao.addEventListener('click', () => {
      if (ajuda.escalonamento) naoEntendi();
      else escolherAjuda(ajuda.id);
    });
    lista.appendChild(botao);
  }
}

function itemTemAjuda(item, ajudaId) {
  if (ajudaId === 'maisSimples') return !!item.maisSimples;
  if (ajudaId === 'exemplo') return !!item.exemplo;
  if (ajudaId === 'passos') return item.passos && item.passos.length > 0;
  return true;
}

/* Quatro blocos, na ordem em que a leitura faz sentido: qual ajuda funcionou
   mais com VOCÊ, o placar por ajuda, o que funcionou por matéria, e a frase
   que fecha. */
function renderPerfil() {
  const p = derivarPerfil();
  const corpo = pegar('perfil-corpo');
  corpo.innerHTML = '';

  if (p.total === 0) {
    corpo.innerHTML = '<p class="vazio">Ainda não tem nenhuma tentativa registrada. ' +
      'Resolva uma tarefa para o app começar a observar.</p>';
    return;
  }

  if (p.maisUsada) {
    const titulo = document.createElement('h2');
    titulo.className = 'perfil-titulo';
    titulo.textContent = 'Com você, funcionou mais: ' + ajudaPorId(p.maisUsada).curto;
    corpo.appendChild(titulo);
  }

  const tabela = document.createElement('div');
  tabela.className = 'placar';
  for (const ajudaId in p.acertos) {
    const a = ajudaPorId(ajudaId);
    const { dentro, total } = p.acertos[ajudaId];
    const linha = document.createElement('div');
    linha.className = 'placar-linha';
    linha.innerHTML =
      '<span class="placar-nome">' + a.curto + '</span>' +
      '<span class="placar-barra"><span style="width:' + Math.round((dentro / total) * 100) + '%"></span></span>' +
      '<span class="placar-num">' + dentro + ' de ' + total + '</span>';
    tabela.appendChild(linha);
  }
  corpo.appendChild(tabela);

  if (Object.keys(p.melhorPorMateria).length) {
    const porMat = document.createElement('div');
    porMat.className = 'por-materia';
    for (const materia in p.melhorPorMateria) {
      const melhor = p.melhorPorMateria[materia];
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = MATERIAS[materia] + ': ' + ajudaPorId(melhor).curto;
      porMat.appendChild(chip);
    }
    corpo.appendChild(porMat);
  }

  const fecho = document.createElement('p');
  fecho.className = 'perfil-fecho';
  fecho.textContent = 'O app não adivinha — ele observa o que você conseguiu usar.';
  corpo.appendChild(fecho);
}

/* Baixa o JSON. É o mesmo log que a tela mostra, sem formatação — serve para
   provar que o registro é real e append-only. */
function exportarLog() {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'orbita-log.json';
  link.click();
  URL.revokeObjectURL(url);
}

/* --- O nome do aluno ------------------------------------------------------ */

/* Nunca entra no `dados`. Fica em chave própria justamente para isso: o arquivo
   que o aluno baixa é o registro de APRENDER, e não precisa carregar a
   identidade de quem aprendeu. Se um dia o app for usado com turma real, o
   log exportado continua anônimo. */
function nomeSalvo() {
  try {
    return (localStorage.getItem(CHAVE_NOME) || '').trim();
  } catch (e) {
    return '';
  }
}

function salvarNome(nome) {
  try {
    localStorage.setItem(CHAVE_NOME, nome);
  } catch (e) {
    /* O nome é o único dado que o aluno digitou. Se não couber, o app segue
       funcionando com a saudação genérica — perder a personalização é
       preferível a travar a entrada. */
  }
}

/* Saudação por hora do dia. Às 22h "Bom dia" está errado, e o app inteiro se
   esforça para não dizer a coisa errada na tela. */
function renderNome() {
  const h = new Date().getHours();
  const parte = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const nome = nomeSalvo();
  pegar('saudacao').textContent = nome ? parte + ', ' + nome + '.' : parte + '.';
}

/* Entrada do nome. Só aparece se não houver nome salvo — na segunda visita o
   aluno vai direto para a rotina, sem atrito. */
function renderTelaNome() {
  mostrar('nome');
  const campo = pegar('campo-nome');
  if (campo) campo.focus();
}

document.addEventListener('DOMContentLoaded', () => {
  const guardado = carregarDados();
  if (guardado) dados = guardado;
  if (!dados.itens || !dados.itens.length) {
    dados.itens = montarRotina();
  }

  const calm = pegar('modo-calmo');
  calm.checked = dados.modoCalmo;
  aplicarModoCalmo();
  calm.addEventListener('change', () => {
    dados.modoCalmo = calm.checked;
    salvarDados();
    aplicarModoCalmo();
  });

  /* Qualquer volta para a tela principal passa por aqui: fechar sessão, trocar
     a tela e redesenhar. Três botões faziam isso à mão, e um esquecimento
     significaria a tela trocada sem o conteúdo — que foi exatamente o bug que
     os testes 11 e 12 pegaram. */
  function irPara(tela) {
    sessao = null;
    mostrar(tela);
    if (tela === 'rotina') renderRotina();
    else if (tela === 'perfil') renderPerfil();
  }

  // Usado entre takes da gravação.
  pegar('btn-reiniciar').addEventListener('click', () => {
    if (!confirm('Recomeçar o dia? O histórico de tentativas fica.')) return;
    dados.itens = montarRotina();
    salvarDados();
    irPara('rotina');
  });

  pegar('btn-rotina').addEventListener('click', () => irPara('rotina'));
  pegar('btn-perfil').addEventListener('click', () => irPara('perfil'));

  /* "Está difícil" fica sempre visível. É a saída do aluno quando trava, e não
     pode viver escondido atrás de menu nenhum. */
  pegar('btn-dificil').addEventListener('click', mostrarAjuda);
  pegar('btn-nao-entendi').addEventListener('click', naoEntendi);

  pegar('btn-voltar').addEventListener('click', () => irPara('rotina'));

  /* Voltar da escolha de ajuda devolve o aluno à MESMA questão, com o
     enunciado intacto — cancelar uma ajuda não pode custar o trabalho que ele
     já fez. Aqui NÃO passa por irPara: a sessão continua viva, senão o aluno
     perderia a ajuda que acabou de escolher. */
  pegar('btn-voltar-ajuda').addEventListener('click', () => {
    mostrar('tarefa');
    renderTarefa();
  });

  pegar('btn-exportar').addEventListener('click', exportarLog);

  /* Entra pelo nome uma vez, depois direto na rotina. A pergunta nunca aparece
     de novo: um atrito recorrente é o oposto do que o app promete. */
  pegar('form-nome').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const nome = (pegar('campo-nome').value || '').trim();
    if (nome) salvarNome(nome);
    renderNome();
    irPara('rotina');
  });

  renderNome();
  if (nomeSalvo()) irPara('rotina');
  else renderTelaNome();
});
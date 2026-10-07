/* Este arquivo é só DADOS. Nenhuma lógica aqui.

   Por que o conteúdo mora no código e não no navegador do aluno? Porque um
   erro de texto nunca pode corromper o histórico de ninguém. Se o conteúdo
   estivesse salvo junto com o progresso, uma versão ruim do enunciado poderia
   estragar o registro de tentativas. Aqui o histórico é do aluno; aqui o
   conteúdo é do sistema.

   REGRA DE AUTORIA (vale para todos os tipos de ajuda):
   - O objetivo NUNCA muda. Muda o caminho para chegar nele.
   - "Mais simples" não é "para exceção". É a mesma conta, com menos
     palavras — nunca com menos desafio. */

const MATERIAS = {
  matematica: 'Matemática',
  portugues: 'Português',
  ciencias: 'Ciências',
};

/* As quatro representações + o escalonamento.
   `naoEntendi` NÃO é representação: é o sinal de "suba um degrau".
   Por isso ele não entra no perfil — se entrasse, o perfil mentiria. */
const AJUDAS = [
  { id: 'maisSimples', rotulo: 'Me explica de um jeito mais simples', curto: 'mais simples' },
  { id: 'exemplo', rotulo: 'Mostra um exemplo parecido', curto: 'exemplo' },
  { id: 'passos', rotulo: 'Me explica em passos', curto: 'em passos' },
  { id: 'ouvir', rotulo: 'Quero ouvir', curto: 'ouvido' },
  { id: 'naoEntendi', rotulo: 'Ainda não entendi', curto: 'não entendi', escalonamento: true },
];

/* Os 6 itens da rotina. Dois de cada matéria, cada um com as TRÊS
   representações escritas à mão (mais simples · exemplo · em passos). A
   quarta, "ouvir", não precisa de texto: é o enunciado lido em voz alta pelo
   navegador. */

const ITENS = [
  // Matemática
  {
    id: 'mat-fracao-pizza',
    materia: 'matematica',
    enunciado: 'Uma pizza foi dividida em 8 pedaços iguais. Arthur comeu 3 pedaços. Que fração da pizza ele comeu?',
    opcoes: ['8/3', '1/3', '3/8', '6/8'],
    gabarito: 2,
    maisSimples:
      'São 8 pedaços no total. Arthur comeu 3 deles. A resposta é 3 de 8.',
    exemplo:
      'Se Arthur tivesse comido 2 pedaços, a resposta seria 2/8 — dois de oito. Como ele comeu 3, a resposta é 3/8: três de oito.',
    passos: [
      'O total de pedaços é 8. Esse número vai embaixo, no denominador.',
      'Os pedaços que Arthur comeu são 3. Esse número vai em cima, no numerador.',
      'Juntando os dois: 3/8. Três de oito.',
    ],
  },
  {
    id: 'mat-proporcao-bolo',
    materia: 'matematica',
    enunciado: 'Uma receita de bolo usa 2 xícaras de farinha para cada 3 de leite. Se Arthur usar 4 xícaras de farinha, quantas xícaras de leite ele precisa?',
    opcoes: ['4 xícaras', '5 xícaras', '8 xícaras', '6 xícaras'],
    gabarito: 3,
    maisSimples:
      'A farinha dobrou: foi de 2 para 4. Quando uma parte dobra, a outra dobra também. O leite vai de 3 para 6.',
    exemplo:
      'Na receita original, 2 de farinha acompanham 3 de leite. Se a farinha dobra (2 vira 4), o leite também dobra: 3 vira 6. Então são 6 xícaras de leite.',
    passos: [
      'Na receita que já existe: 2 de farinha → 3 de leite.',
      'Agora a farinha é 4. E 4 é o dobro de 2.',
      'O dobro de 3 é 6. Portanto, o leite precisa de 6 xícaras.',
    ],
  },

  // Português
  {
    id: 'por-aviso-celular',
    materia: 'portugues',
    enunciado: 'Na escola, um cartaz diz: "Proibido o uso de celular na sala de aula". Qual é o propósito desse aviso?',
    opcoes: [
      'Convencer os alunos a comprar um celular',
      'Avisar que não se pode usar celular na sala',
      'Contar uma história sobre celular',
    ],
    gabarito: 1,
    maisSimples:
      'O cartaz está avisando uma regra. A regra é: celular não pode ser usado na sala de aula.',
    exemplo:
      'Quando um aviso diz "Proibido estacionar", ele serve para avisar que não pode estacionar. Este cartaz faz a mesma coisa, só que com celular.',
    passos: [
      'A palavra mais importante do cartaz é "Proibido".',
      '"Proibido" quer dizer "não pode".',
      'Então o aviso serve para dizer que não pode usar celular na sala. É essa a resposta.',
    ],
  },
  {
    id: 'por-faz-tres-anos',
    materia: 'portugues',
    enunciado: 'Qual das frases está correta?',
    opcoes: [
      'Fazem três anos que eu moro aqui.',
      'Faz três anos que eu moro aqui.',
    ],
    gabarito: 1,
    maisSimples:
      'Quando "fazer" fala de tempo que passou, ele fica sempre no singular: "faz". Então o certo é "Faz três anos".',
    exemplo:
      '"Faz dois meses que ela viajou." Mesmo com "dois meses", o verbo continua "faz". Nunca "fazem".',
    passos: [
      'Aqui o verbo "fazer" fala de tempo que passou: três anos.',
      'Nesse uso ele não muda: fica sempre "faz", mesmo com número maior que um.',
      'Por isso: "Faz três anos que eu moro aqui."',
    ],
  },

  // Ciências
  {
    id: 'cie-estacoes-ano',
    materia: 'ciencias',
    enunciado: 'Por que existem as estações do ano?',
    opcoes: [
      'Porque o Sol fica mais perto da Terra no verão',
      'Porque a Lua cobre o Sol em algumas datas',
      'Porque a Terra gira inclinada em torno do Sol, e cada lado fica mais tempo iluminado em uma parte do ano',
    ],
    gabarito: 2,
    maisSimples:
      'O eixo da Terra é inclinado. Quando um lado da Terra fica mais virado para o Sol, é verão. Do outro lado, é inverno.',
    exemplo:
      'Imagine uma bola com um palito atravessado, e uma lamparina. Se a lamparina ficar de frente para o palito, a frente da bola fica mais iluminada e a parte de trás, menos. É assim que a Terra fica em cada estação.',
    passos: [
      'A Terra anda em volta do Sol, e o eixo dela é inclinado.',
      'Por causa dessa inclinação, em cada época do ano um lado da Terra recebe mais luz do Sol.',
      'O lado que recebe mais luz esquenta mais: lá é verão. No outro lado, é inverno.',
    ],
  },
  {
    id: 'cie-fio-cortado',
    materia: 'ciencias',
    enunciado: 'Um circuito tem uma bateria, um fio e uma lâmpada. Se alguém cortar o fio, o que acontece com a lâmpada?',
    opcoes: [
      'Continua acesa, porque a bateria ainda tem energia',
      'Fica mais forte, porque a corrente se concentra na lâmpada',
      'Apaga, porque a corrente perdeu o caminho para dar a volta',
    ],
    gabarito: 2,
    maisSimples:
      'A corrente elétrica precisa de um caminho fechado para passar. O fio cortado abriu esse caminho, então a corrente para e a lâmpada apaga.',
    exemplo:
      'Pense numa pista de corrida que dá a volta no quarteirão. Se fecharem um trecho, ninguém consegue completar a volta.',
    passos: [
      'Para a lâmpada acender, a corrente precisa dar a volta completa no circuito.',
      'Cortar o fio abriu um buraco nesse caminho.',
      'A corrente não consegue mais passar. Sem corrente, a lâmpada apaga.',
    ],
  },
];
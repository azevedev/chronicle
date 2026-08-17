/**
 * i18n.js — bilingual copy for the whole game.
 *
 * Every player-visible string lives here. `t()` returns the active language,
 * falling back to English if a key is missing so a gap shows up as plain
 * English rather than an empty box.
 *
 * House style: the copy is written as a Victorian broadsheet would set it —
 * "DISPATCH", "VERDICT", "THE SUBJECT" — in both languages. The Portuguese is
 * not a literal translation of the English; both are written to read naturally
 * in period register.
 */

export const LANGS = ['en', 'pt'];
export const LANG_NAMES = { en: 'English', pt: 'Português' };

const STRINGS = {
  en: {
    // — masthead / chrome —
    'app.title': 'The Chronicle',
    'app.tagline': 'Wherein the Dead Are Named',
    'app.motto': 'Two Pins Upon the Map · One Life Between',
    'app.edition': 'Edition',
    'app.price': 'One Penny',

    // — modes —
    'mode.daily': 'The Daily Dispatch',
    'mode.daily.sub': 'One subject. All readers. Until midnight.',
    'mode.daily.desc':
      'A single figure, the same for every reader in the world, drawn afresh each day at midnight by Greenwich reckoning. Your streak is recorded.',
    'mode.gauntlet': 'The Gauntlet',
    'mode.gauntlet.sub': 'Five subjects. No reprieve.',
    'mode.gauntlet.desc':
      'Five figures in succession, scored in sum. There is no second attempt at a subject once it is closed.',
    'mode.infinite': 'The Perpetual Edition',
    'mode.infinite.sub': 'Without end. Until three are lost.',
    'mode.infinite.desc':
      'Figures without number, drawn until three have defeated you. Your longest run is preserved.',
    'mode.play': 'Begin',
    'mode.resume': 'Resume',
    'mode.done': 'Completed today',
    'mode.daily.note': 'Always drawn from the Hundred.',

    // — the register / difficulty —
    'diff.title': 'The Register',
    'diff.remarkable': 'Remarkable Only',
    'diff.overall': 'The Whole Register',
    'diff.remarkable.short': 'Remarkable',
    'diff.overall.short': 'Overall',
    'diff.remarkable.note': 'The Hundred best known figures — names a reader may fairly be expected to know.',
    'diff.overall.note': 'All {n} figures, the obscure alongside the celebrated. Deeper cuts pay more.',
    'diff.applies':
      'Applies to the Gauntlet and the Perpetual Edition. The Daily Dispatch is always drawn from the Hundred.',
    'hundred.badge': 'One of the Hundred',
    'hundred.rank': 'No. {n} of the Hundred',

    // — round —
    'round.dispatch': 'Dispatch',
    'round.of': 'of',
    'round.born': 'Born',
    'round.died': 'Died',
    'round.bornAt': 'Born at',
    'round.diedAt': 'Died at',
    'round.question': 'Who was this person?',
    'round.placeholder': 'Name the subject…',
    'round.submit': 'Submit',
    'round.skip': 'Skip',
    'round.guessesLeft': 'Attempts remaining',
    'round.attempt': 'Attempt',
    'round.hint': 'Hint',
    'round.hints': 'Intelligence Received',
    'round.noHints': 'No intelligence yet received.',
    'round.tradition': 'Dates by tradition',
    'round.traditionNote':
      'The record for this figure is traditional rather than documentary; dates and places are those handed down.',
    'round.aged': 'aged',
    'round.unknownAge': 'age unrecorded',
    'round.score': 'Score',
    'round.total': 'Total',
    'round.lives': 'Losses',
    'round.noMatch': 'No such figure in the register.',
    'round.worth': 'worth {n}',
    'round.alreadyTried': 'You have already offered that name.',

    // — hint ladder —
    'hint.field': 'The First Hint · Their Calling',
    'hint.deed': 'The Second Hint · Their Deed',
    'hint.initials': 'The Third Hint · Their Initials',
    'hint.initialsBody': 'Initials {initials} · {counts}.',
    'hint.letters': '{n} letters',
    'hint.letters.one': '{n} letter',

    // — verdict —
    'verdict.correct': 'Identified',
    'verdict.failed': 'Unidentified',
    'verdict.wasBorn': 'The subject was',
    'verdict.inAttempts': 'Named in {n} attempts',
    'verdict.inAttempt': 'Named on the first attempt',
    'verdict.pointsAwarded': 'Points awarded',
    'verdict.noPoints': 'No points awarded',
    'verdict.next': 'Next Dispatch',
    'verdict.finish': 'Close the Edition',
    'verdict.lifespan': 'Lifespan',
    'verdict.readMore': 'Read further on Wikipedia',
    'verdict.portraitCredit': 'Portrait via Wikimedia Commons',
    'verdict.years': 'years',

    // — session summary —
    'summary.title': 'The Final Edition',
    'summary.daily': 'Daily Dispatch',
    'summary.gauntlet': 'The Gauntlet',
    'summary.infinite': 'The Perpetual Edition',
    'summary.totalScore': 'Total Score',
    'summary.solved': 'Identified',
    'summary.attempts': 'Attempts Spent',
    'summary.streak': 'Current Streak',
    'summary.bestRun': 'Longest Run',
    'summary.share': 'Copy Result',
    'summary.shared': 'Copied to clipboard',
    'summary.again': 'Play Again',
    'summary.home': 'Return to the Front Page',
    'summary.perfect': 'A flawless edition.',
    'summary.tomorrow': 'The next dispatch arrives in {time}.',
    'summary.next': 'Next edition',

    // — stats —
    'stats.title': 'The Ledger',
    'stats.played': 'Played',
    'stats.winRate': 'Win Rate',
    'stats.streak': 'Streak',
    'stats.maxStreak': 'Longest Streak',
    'stats.distribution': 'Attempts to Identify',
    'stats.failed': 'Lost',
    'stats.bestGauntlet': 'Best Gauntlet',
    'stats.bestInfinite': 'Longest Perpetual Run',
    'stats.empty': 'The ledger is empty. Play a dispatch to begin it.',
    'stats.reset': 'Erase the Ledger',
    'stats.resetConfirm': 'Erase all recorded results? This cannot be undone.',

    // — archive —
    'archive.title': 'The Archive',
    'archive.sub':
      'Back numbers. A day you have already met is named here; the rest keep their counsel. Reading one is practice only and is not scored.',
    'archive.empty': 'No back numbers yet.',
    'archive.play': 'Read',
    'archive.replay': 'Read again',
    'archive.solved': 'Identified',
    'archive.lost': 'Unidentified',
    'archive.unplayed': 'Unread',
    'archive.seen': 'Read in practice',
    'archive.practice': 'Practice only, not scored',
    'archive.withheld': 'Withheld until read',

    // — how to play —
    'help.title': 'How to Read This Paper',
    'help.lead':
      'A dispatch names no one. It gives you a life reduced to its two ends — a place of birth and a place of death, each with its year — and asks you whose it was.',
    'help.evidence.title': 'I · The Evidence',
    'help.evidence':
      'Two pins are set upon the map: one where the subject was born, one where they died. Beneath them stand both years and the age between. That is the whole of the record. Where a life is known by tradition rather than by document, the dispatch says so plainly.',
    'help.attempts.title': 'II · The Attempts',
    'help.attempts':
      'You have four. A name that is not in the register costs you nothing — offer another. A name that is in the register but is the wrong person costs one attempt, and so does skipping. Each attempt spent releases the next hint: first the subject’s calling, then their deed, then their initials and the length of their name.',
    'help.award.title': 'III · The Award',
    'help.award':
      'Name the subject on the first attempt, before any hint, and the dispatch pays in full. Each attempt after that is worth less than the one before. Miss on the fourth and it closes unscored.',
    'help.award.attempt': 'Attempt',
    'help.award.pays': 'Pays',
    'help.award.note':
      'Figures drawn from beyond the Hundred pay a premium, being the harder to place.',
    'help.editions.title': 'IV · The Editions',
    'help.editions':
      'The Daily Dispatch is a single figure, the same for every reader in the world, changing at midnight by Greenwich reckoning; it alone keeps a streak. The Gauntlet sets five subjects in succession, scored in sum. The Perpetual Edition runs without end until three have defeated you.',
    'help.register.title': 'V · The Register',
    'help.register':
      'You may choose how deep the paper draws. Remarkable Only keeps to the Hundred: the most widely known figures in the register, ranked in order. The Whole Register admits all {n}, obscure and celebrated alike. A figure of the Hundred is marked as such wherever they appear, so you always know which you have met.',
    'help.begin': 'Begin Reading',
    'help.privacy':
      'Your results and settings are kept in this browser only. There are no accounts, no cookies and no analytics. The one thing that leaves your device is the portrait on the verdict sheet, which loads from Wikimedia; if you would rather it did not, the game works perfectly well offline without it.',
    'help.close': 'Close',

    // — settings —
    'set.sound': 'Sound',
    'set.music': 'Music',
    'set.language': 'Language',
    'set.on': 'On',
    'set.off': 'Off',
    'set.stats': 'Ledger',
    'set.archive': 'Archive',
    'set.help': 'How to Play',
    'set.back': 'Back',
    'set.leave': 'Leave this dispatch',

    // — misc —
    'ui.loading': 'Setting the type…',
    'ui.error': 'The press has jammed.',
    'ui.errorBody': 'Something went wrong while loading the edition. Try reloading the page.',
    'ui.close': 'Close',
    'ui.circa': 'c.',
    'ui.bc': 'BC',
    'ui.ad': 'AD',
    'ui.present': 'present',
  },

  pt: {
    // — cabeçalho / interface —
    'app.title': 'O Chronicle',
    'app.tagline': 'Onde os Mortos São Nomeados',
    'app.motto': 'Dois Alfinetes no Mapa · Uma Vida Entre Eles',
    'app.edition': 'Edição',
    'app.price': 'Um Vintém',

    // — modos —
    'mode.daily': 'O Despacho Diário',
    'mode.daily.sub': 'Um vulto. Todos os leitores. Até a meia-noite.',
    'mode.daily.desc':
      'Uma única figura, a mesma para todos os leitores do mundo, sorteada a cada dia à meia-noite pelo meridiano de Greenwich. Sua sequência fica registrada.',
    'mode.gauntlet': 'A Provação',
    'mode.gauntlet.sub': 'Cinco vultos. Sem clemência.',
    'mode.gauntlet.desc':
      'Cinco figuras em sucessão, somadas ao final. Não há segunda tentativa depois que um vulto se encerra.',
    'mode.infinite': 'A Edição Perpétua',
    'mode.infinite.sub': 'Sem fim. Até que três se percam.',
    'mode.infinite.desc':
      'Figuras sem número, sorteadas até que três o derrotem. Sua melhor sequência é preservada.',
    'mode.play': 'Começar',
    'mode.resume': 'Retomar',
    'mode.done': 'Concluído hoje',
    'mode.daily.note': 'Sorteado sempre entre os Cem.',

    // — o registro / dificuldade —
    'diff.title': 'O Registro',
    'diff.remarkable': 'Somente os Notáveis',
    'diff.overall': 'O Registro Inteiro',
    'diff.remarkable.short': 'Notáveis',
    'diff.overall.short': 'Inteiro',
    'diff.remarkable.note': 'Os Cem vultos mais conhecidos — nomes que se pode esperar de qualquer leitor.',
    'diff.overall.note': 'Todas as {n} figuras, as obscuras ao lado das célebres. Os cortes fundos pagam mais.',
    'diff.applies':
      'Vale para a Provação e a Edição Perpétua. O Despacho Diário sai sempre dentre os Cem.',
    'hundred.badge': 'Um dos Cem',
    'hundred.rank': 'N.º {n} dos Cem',

    // — rodada —
    'round.dispatch': 'Despacho',
    'round.of': 'de',
    'round.born': 'Nasceu',
    'round.died': 'Morreu',
    'round.bornAt': 'Nasceu em',
    'round.diedAt': 'Morreu em',
    'round.question': 'Quem foi esta pessoa?',
    'round.placeholder': 'Nomeie o vulto…',
    'round.submit': 'Responder',
    'round.skip': 'Pular',
    'round.guessesLeft': 'Tentativas restantes',
    'round.attempt': 'Tentativa',
    'round.hint': 'Pista',
    'round.hints': 'Informações Recebidas',
    'round.noHints': 'Nenhuma informação recebida ainda.',
    'round.tradition': 'Datas por tradição',
    'round.traditionNote':
      'O registro desta figura é tradicional, não documental; as datas e os lugares são os que a tradição transmitiu.',
    'round.aged': 'aos',
    'round.unknownAge': 'idade não registrada',
    'round.score': 'Pontos',
    'round.total': 'Total',
    'round.lives': 'Perdas',
    'round.noMatch': 'Não há tal figura no registro.',
    'round.worth': 'vale {n}',
    'round.alreadyTried': 'Você já ofereceu esse nome.',

    // — escada de pistas —
    'hint.field': 'A Primeira Pista · Seu Ofício',
    'hint.deed': 'A Segunda Pista · Seu Feito',
    'hint.initials': 'A Terceira Pista · Suas Iniciais',
    'hint.initialsBody': 'Iniciais {initials} · {counts}.',
    'hint.letters': '{n} letras',
    'hint.letters.one': '{n} letra',

    // — veredito —
    'verdict.correct': 'Identificado',
    'verdict.failed': 'Não Identificado',
    'verdict.wasBorn': 'O vulto era',
    'verdict.inAttempts': 'Nomeado em {n} tentativas',
    'verdict.inAttempt': 'Nomeado na primeira tentativa',
    'verdict.pointsAwarded': 'Pontos concedidos',
    'verdict.noPoints': 'Nenhum ponto concedido',
    'verdict.next': 'Próximo Despacho',
    'verdict.finish': 'Encerrar a Edição',
    'verdict.lifespan': 'Vida',
    'verdict.readMore': 'Leia mais na Wikipédia',
    'verdict.portraitCredit': 'Retrato via Wikimedia Commons',
    'verdict.years': 'anos',

    // — resumo da sessão —
    'summary.title': 'A Edição Final',
    'summary.daily': 'Despacho Diário',
    'summary.gauntlet': 'A Provação',
    'summary.infinite': 'A Edição Perpétua',
    'summary.totalScore': 'Pontuação Total',
    'summary.solved': 'Identificados',
    'summary.attempts': 'Tentativas Gastas',
    'summary.streak': 'Sequência Atual',
    'summary.bestRun': 'Maior Sequência',
    'summary.share': 'Copiar Resultado',
    'summary.shared': 'Copiado para a área de transferência',
    'summary.again': 'Jogar de Novo',
    'summary.home': 'Voltar à Primeira Página',
    'summary.perfect': 'Uma edição impecável.',
    'summary.tomorrow': 'O próximo despacho chega em {time}.',
    'summary.next': 'Próxima edição',

    // — estatísticas —
    'stats.title': 'O Livro-Razão',
    'stats.played': 'Jogados',
    'stats.winRate': 'Aproveitamento',
    'stats.streak': 'Sequência',
    'stats.maxStreak': 'Maior Sequência',
    'stats.distribution': 'Tentativas até Identificar',
    'stats.failed': 'Perdidos',
    'stats.bestGauntlet': 'Melhor Provação',
    'stats.bestInfinite': 'Maior Edição Perpétua',
    'stats.empty': 'O livro-razão está vazio. Jogue um despacho para começá-lo.',
    'stats.reset': 'Apagar o Livro-Razão',
    'stats.resetConfirm': 'Apagar todos os resultados registrados? Isto não pode ser desfeito.',

    // — arquivo —
    'archive.title': 'O Arquivo',
    'archive.sub':
      'Números atrasados. O dia que você já encontrou aparece nomeado aqui; os demais guardam segredo. Lê-los é apenas prática, sem pontuação.',
    'archive.empty': 'Ainda não há números atrasados.',
    'archive.play': 'Ler',
    'archive.replay': 'Ler de novo',
    'archive.solved': 'Identificado',
    'archive.lost': 'Não identificado',
    'archive.unplayed': 'Não lido',
    'archive.seen': 'Lido em prática',
    'archive.practice': 'Apenas prática, sem pontuação',
    'archive.withheld': 'Reservado até a leitura',

    // — como jogar —
    'help.title': 'Como Ler Este Jornal',
    'help.lead':
      'Um despacho não nomeia ninguém. Ele oferece uma vida reduzida às suas duas pontas — um lugar de nascimento e um lugar de morte, cada qual com seu ano — e pergunta de quem ela foi.',
    'help.evidence.title': 'I · As Provas',
    'help.evidence':
      'Dois alfinetes são fincados no mapa: um onde o vulto nasceu, outro onde morreu. Abaixo deles estão os dois anos e a idade entre um e outro. É todo o registro. Quando uma vida se conhece por tradição, e não por documento, o despacho o declara sem rodeios.',
    'help.attempts.title': 'II · As Tentativas',
    'help.attempts':
      'São quatro. Um nome que não consta do registro nada lhe custa — ofereça outro. Um nome que consta, mas é de outra pessoa, custa uma tentativa; pular custa o mesmo. Cada tentativa gasta libera a pista seguinte: primeiro o ofício do vulto, depois seu feito, por fim suas iniciais e o tamanho do nome.',
    'help.award.title': 'III · O Prêmio',
    'help.award':
      'Nomeie o vulto na primeira tentativa, antes de qualquer pista, e o despacho paga por inteiro. Cada tentativa seguinte vale menos que a anterior. Erre na quarta e ele se encerra sem pontos.',
    'help.award.attempt': 'Tentativa',
    'help.award.pays': 'Paga',
    'help.award.note':
      'Figuras sorteadas fora dos Cem pagam um ágio, por serem mais difíceis de situar.',
    'help.editions.title': 'IV · As Edições',
    'help.editions':
      'O Despacho Diário é uma única figura, a mesma para todos os leitores do mundo, trocada à meia-noite pelo meridiano de Greenwich; só ele guarda sequência. A Provação apresenta cinco vultos em sucessão, somados ao final. A Edição Perpétua corre sem fim até que três o derrotem.',
    'help.register.title': 'V · O Registro',
    'help.register':
      'Pode-se escolher a que profundidade o jornal sorteia. Somente os Notáveis se atém aos Cem: as figuras mais conhecidas do registro, postas em ordem. O Registro Inteiro admite todas as {n}, obscuras e célebres por igual. Uma figura dos Cem é assinalada onde quer que apareça, para que se saiba sempre qual delas se encontrou.',
    'help.begin': 'Começar a Ler',
    'help.privacy':
      'Seus resultados e ajustes ficam somente neste navegador. Não há contas, cookies nem análise de tráfego. A única coisa que sai do seu aparelho é o retrato na folha do veredito, carregado da Wikimedia; se preferir que não saia, o jogo funciona perfeitamente offline sem ele.',
    'help.close': 'Fechar',

    // — ajustes —
    'set.sound': 'Som',
    'set.music': 'Música',
    'set.language': 'Idioma',
    'set.on': 'Ligado',
    'set.off': 'Desligado',
    'set.stats': 'Livro-Razão',
    'set.archive': 'Arquivo',
    'set.help': 'Como Jogar',
    'set.back': 'Voltar',
    'set.leave': 'Sair deste despacho',

    // — diversos —
    'ui.loading': 'Compondo os tipos…',
    'ui.error': 'O prelo emperrou.',
    'ui.errorBody': 'Algo deu errado ao carregar a edição. Tente recarregar a página.',
    'ui.close': 'Fechar',
    'ui.circa': 'c.',
    'ui.bc': 'a.C.',
    'ui.ad': 'd.C.',
    'ui.present': 'presente',
  },
};

/**
 * Occupation descriptors — the first hint. Written as a newspaper would
 * describe a person's calling rather than as a job title, so the hint narrows
 * the field without naming the trade outright.
 */
export const FIELDS = {
  ruler:        { en: 'A wearer of crowns.',                    pt: 'Alguém que portou uma coroa.' },
  statesman:    { en: 'A shaper of nations.',                   pt: 'Um formador de nações.' },
  general:      { en: 'A commander of armies.',                 pt: 'Um comandante de exércitos.' },
  revolutionary:{ en: 'An overthrower of the old order.',       pt: 'Um destruidor da velha ordem.' },
  activist:     { en: 'A voice raised against injustice.',      pt: 'Uma voz erguida contra a injustiça.' },
  religious:    { en: 'A founder of faith.',                    pt: 'Um fundador de fé.' },
  philosopher:  { en: 'A questioner of first things.',          pt: 'Um investigador das primeiras causas.' },
  scientist:    { en: "A reader of nature's laws.",             pt: 'Um leitor das leis da natureza.' },
  astronomer:   { en: 'A watcher of the heavens.',              pt: 'Um observador dos céus.' },
  mathematician:{ en: 'A student of number and proof.',         pt: 'Um estudioso do número e da prova.' },
  physician:    { en: 'A healer of bodies.',                    pt: 'Um curador de corpos.' },
  psychologist: { en: 'A cartographer of the mind.',            pt: 'Um cartógrafo da mente.' },
  inventor:     { en: 'A maker of new machines.',               pt: 'Um criador de máquinas novas.' },
  engineer:     { en: 'A builder of works.',                    pt: 'Um construtor de obras.' },
  architect:    { en: 'A raiser of buildings.',                 pt: 'Um erguedor de edifícios.' },
  explorer:     { en: 'A crosser of unmapped distances.',       pt: 'Um viajante de distâncias não mapeadas.' },
  aviator:      { en: 'A traveller of the upper air.',          pt: 'Um viajante do ar superior.' },
  artist:       { en: 'A worker in paint and stone.',           pt: 'Um trabalhador da tinta e da pedra.' },
  composer:     { en: 'A setter of notes upon the page.',       pt: 'Alguém que dispôs notas sobre a pauta.' },
  musician:     { en: 'A maker of song.',                       pt: 'Um criador de canções.' },
  writer:       { en: 'A worker in ink and paper.',             pt: 'Um trabalhador da tinta e do papel.' },
  economist:    { en: 'A student of wealth and want.',          pt: 'Um estudioso da riqueza e da escassez.' },
  industrialist:{ en: 'A master of trade and manufacture.',     pt: 'Um senhor do comércio e da indústria.' },
  nurse:        { en: 'A tender of the wounded.',               pt: 'Um cuidador dos feridos.' },
  athlete:      { en: 'A contender in the arena.',              pt: 'Um competidor na arena.' },
  filmmaker:    { en: 'A worker in moving pictures.',           pt: 'Um trabalhador das imagens em movimento.' },
  outlaw:       { en: 'A defier of the law.',                   pt: 'Um desafiador da lei.' },
};

let current = 'en';

export function getLang() {
  return current;
}

export function setLang(lang) {
  current = LANGS.includes(lang) ? lang : 'en';
  document.documentElement.lang = current === 'pt' ? 'pt-BR' : 'en';
  return current;
}

/** Best-guess starting language from the browser, defaulting to English. */
export function detectLang() {
  const nav = (navigator.languages || [navigator.language || 'en']).join(',').toLowerCase();
  return nav.includes('pt') ? 'pt' : 'en';
}

/** t('round.born') / t('summary.tomorrow', { time: '07h 12m' }) */
export function t(key, vars) {
  let s = STRINGS[current]?.[key] ?? STRINGS.en[key];
  if (s === undefined) {
    console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}

/** Grammatical plural for the letter-count hint. */
export function letterCount(n) {
  return t(n === 1 ? 'hint.letters.one' : 'hint.letters', { n });
}

/** Pick the localised half of a `[en, pt]` pair, or pass a plain string through. */
export function pick(value) {
  if (Array.isArray(value)) return value[current === 'pt' ? 1 : 0] ?? value[0];
  return value;
}

/** Occupation descriptor for the first hint. */
export function fieldLabel(key) {
  const f = FIELDS[key];
  if (!f) {
    console.warn(`[i18n] unknown field: ${key}`);
    return '';
  }
  return f[current] ?? f.en;
}

/**
 * Year as the paper would print it: 44 BC, AD 14, 1821.
 * Negative years are BC; the data stores them that way.
 */
export function formatYear(y, opts = {}) {
  if (y === null || y === undefined) return '—';
  const circa = opts.circa ? t('ui.circa') + ' ' : '';
  if (y < 0) return `${circa}${Math.abs(y)} ${t('ui.bc')}`;
  if (y < 1000 && opts.markAD !== false) return `${circa}${t('ui.ad')} ${y}`;
  return `${circa}${y}`;
}

/** "1769 – 1821" with an en dash, both years formatted. */
export function formatSpan(born, died, opts = {}) {
  return `${formatYear(born, opts)} – ${formatYear(died, opts)}`;
}


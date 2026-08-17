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
    'round.alreadyTried': 'You have already offered that name.',

    // — hint ladder —
    'hint.field': 'The First Hint · Their Calling',
    'hint.deed': 'The Second Hint · Their Deed',
    'hint.initials': 'The Third Hint · Their Initials',
    'hint.initialsBody': 'Initials {initials} — {counts}.',
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
    'archive.sub': 'Back numbers, for practice only. Results are not recorded.',
    'archive.empty': 'No back numbers yet.',
    'archive.play': 'Read',
    'archive.solved': 'Identified',
    'archive.lost': 'Unidentified',
    'archive.unplayed': 'Unread',
    'archive.practice': 'Practice — unscored',

    // — how to play —
    'help.title': 'How to Read This Paper',
    'help.1':
      'Each dispatch gives you two facts and nothing more: where a person was born, and where they died, with the years of both. Both are pinned upon the map.',
    'help.2':
      'You have three attempts to name them. A wrong name — or a skipped attempt — releases a further hint, and lowers the points the dispatch can still award.',
    'help.3':
      'Name them on the first attempt for the full award. The second and third attempts are worth progressively less. Fail all three and the dispatch closes unscored.',
    'help.4':
      'The Daily Dispatch is the same figure for every reader in the world, and changes at midnight, Greenwich reckoning.',
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
    'round.alreadyTried': 'Você já ofereceu esse nome.',

    // — escada de pistas —
    'hint.field': 'A Primeira Pista · Seu Ofício',
    'hint.deed': 'A Segunda Pista · Seu Feito',
    'hint.initials': 'A Terceira Pista · Suas Iniciais',
    'hint.initialsBody': 'Iniciais {initials} — {counts}.',
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
    'archive.sub': 'Números atrasados, apenas para prática. Os resultados não são registrados.',
    'archive.empty': 'Ainda não há números atrasados.',
    'archive.play': 'Ler',
    'archive.solved': 'Identificado',
    'archive.lost': 'Não identificado',
    'archive.unplayed': 'Não lido',
    'archive.practice': 'Prática — sem pontuação',

    // — como jogar —
    'help.title': 'Como Ler Este Jornal',
    'help.1':
      'Cada despacho lhe dá dois fatos e nada mais: onde uma pessoa nasceu e onde morreu, com os anos de ambos. Os dois estão marcados no mapa.',
    'help.2':
      'Você tem três tentativas para nomeá-la. Um nome errado — ou uma tentativa pulada — libera mais uma pista e reduz os pontos que o despacho ainda pode conceder.',
    'help.3':
      'Acerte na primeira tentativa para receber o prêmio integral. A segunda e a terceira valem progressivamente menos. Falhe nas três e o despacho se encerra sem pontos.',
    'help.4':
      'O Despacho Diário é a mesma figura para todos os leitores do mundo e muda à meia-noite, pelo meridiano de Greenwich.',
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

/** t('round.born') / t('hint.letters', { n: 8 }) */
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

/** Grammatical plural for the letter-count hint. */
export function letterCount(n) {
  return t(n === 1 ? 'hint.letters.one' : 'hint.letters', { n });
}

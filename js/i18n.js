/**
 * i18n.js — bilingual copy for the whole game.
 *
 * Every player-visible string lives here. `t()` returns the active language,
 * falling back to English if a key is missing so a gap shows up as plain
 * English rather than an empty box.
 *
 * House style: the paper's Victorian voice is kept where it is decoration —
 * the masthead, the answer sheet, the occupation clues below — and dropped
 * everywhere it would cost a player clarity. Menus, buttons, notices and the
 * how-to-play sheet say plainly what they do: a label has to be understood
 * before it can be charming. The Portuguese is written to read naturally in
 * pt-BR rather than translated word for word, but it says exactly the same
 * things, so a player switching languages mid-game is never told two different
 * rules.
 */

export const LANGS = ['en', 'pt'];
export const LANG_NAMES = { en: 'English', pt: 'Português' };

const STRINGS = {
  en: {
    // — masthead / chrome — the one place the period voice is kept whole —
    'app.title': 'The Chronicle',
    'app.tagline': 'Wherein the Dead Are Named',
    'app.motto': 'Two Pins Upon the Map · One Life Between',
    'app.edition': 'Edition',
    'app.price': 'One Penny',

    // — modes —
    'mode.daily': 'Daily Puzzle',
    'mode.daily.sub': 'One figure a day, the same for everyone.',
    'mode.daily.desc':
      'One historical figure, identical for every player in the world. A new one arrives at midnight UTC. This is the only mode that builds a streak.',
    'mode.gauntlet': 'Five Rounds',
    'mode.gauntlet.sub': 'Five figures in a row. Points added up.',
    'mode.gauntlet.desc':
      'Five figures one after another, their points added into a single score. Once a figure is over you cannot go back to it.',
    'mode.infinite': 'Endless Mode',
    'mode.infinite.sub': 'Keep going until you miss three.',
    'mode.infinite.desc':
      'Figures keep coming until three of them defeat you, getting harder as you go. Your best run is saved.',
    'mode.play': 'Play',
    'mode.resume': 'Resume',
    'mode.done': 'Played today',
    'mode.daily.note': 'Always one of the 100 best-known figures.',
    'home.roster': 'figures in the game',

    // — difficulty —
    'diff.title': 'Difficulty',
    'diff.remarkable': 'Famous only',
    'diff.overall': 'All figures',
    'diff.remarkable.short': 'Famous',
    'diff.overall.short': 'All',
    'diff.remarkable.note': 'The 100 best-known figures — names most people will recognise.',
    'diff.overall.note': 'All {n} figures, famous and obscure alike. The less famous are worth more points.',
    'diff.applies':
      'Applies to Five Rounds and Endless Mode. The Daily Puzzle always uses the 100 best-known figures.',
    'hundred.badge': 'One of the 100 best known',
    'hundred.rank': 'No. {n} of the 100 best known',

    // — round —
    'round.dispatch': 'Round',
    'round.of': 'of',
    'round.born': 'Born',
    'round.died': 'Died',
    'round.bornAt': 'Born in',
    'round.diedAt': 'Died in',
    'round.question': 'Who was this person?',
    'round.placeholder': 'Type a name…',
    'round.submit': 'Guess',
    'round.skip': 'Skip · −1 attempt',
    'round.skipped': 'Skipped',
    'round.guessesLeft': 'Attempts left',
    'round.attempt': 'Attempt',
    'round.hints': 'Clues',
    'round.noHints': 'No clues yet. Each wrong guess or skip reveals one.',
    'round.tradition': 'Traditional dates',
    'round.traditionNote':
      'The dates and places for this figure are traditional rather than documented — they are what history has handed down.',
    'round.aged': 'aged',
    'round.unknownAge': 'age unknown',
    'round.score': 'Points',
    'round.total': 'Total',
    'round.noMatch': 'That name is not in the game — this costs you nothing. Try another spelling or another name.',
    'round.worth': 'worth {n} now',
    'round.alreadyTried': 'You have already guessed that name.',

    // — the cause of death: a clue bought with points, not with an attempt —
    'round.cause': 'Cause of death',
    'round.causeReveal': 'Reveal cause of death · −{n}% points',
    'round.causeSpent': 'Revealed · −{n}% points',
    'cause.title': 'Reveal the cause of death?',
    'cause.body':
      'How this person died is often a strong clue, so it is not free. Name them after this and the round pays {after} instead of {before}, and less again for every further attempt you spend. It costs you no attempt, and it cannot be taken back.',
    'cause.confirm': 'Reveal it',
    'cause.cancel': 'Keep the points',

    // — clue ladder —
    'hint.field': 'Clue 1 · Occupation',
    'hint.deed': 'Clue 2 · What they are known for',
    'hint.initials': 'Clue 3 · Initials and name length',
    'hint.initialsBody': 'Initials {initials} · {counts}.',
    'hint.letters': '{n} letters',
    'hint.letters.one': '{n} letter',

    // — the answer sheet — period voice kept, but every label states its meaning —
    'verdict.correct': 'Correct',
    'verdict.failed': 'Not identified',
    'verdict.wasBorn': 'The answer was',
    'verdict.inAttempts': 'Identified on attempt {n} of {max}',
    'verdict.inAttempt': 'Identified on the first attempt',
    'verdict.pointsAwarded': 'Points earned',
    'verdict.noPoints': 'No points earned',
    'verdict.next': 'Next round',
    'verdict.finish': 'See results',
    'verdict.lifespan': 'Lived',
    'verdict.readMore': 'Read more on Wikipedia',
    'verdict.portraitCredit': 'Portrait via Wikimedia Commons',
    'verdict.years': 'years',

    // — end of a session —
    'summary.title': 'Results',
    'summary.daily': 'Daily Puzzle',
    'summary.gauntlet': 'Five Rounds',
    'summary.infinite': 'Endless Mode',
    'summary.totalScore': 'Total score',
    'summary.solved': 'Identified',
    'summary.attempts': 'Attempts used',
    'summary.streak': 'Current streak',
    'summary.bestRun': 'Best run',
    'summary.share': 'Copy result',
    'summary.shared': 'Copied to clipboard',
    'summary.again': 'Play again',
    'summary.home': 'Back to menu',
    'summary.perfect': 'Perfect — every figure on the first guess.',
    'summary.tomorrow': 'Next daily puzzle in {time}.',
    'summary.next': 'Next in',

    // — statistics —
    'stats.title': 'Statistics',
    'stats.played': 'Dailies played',
    'stats.winRate': 'Win rate',
    'stats.streak': 'Streak',
    'stats.maxStreak': 'Best streak',
    'stats.distribution': 'Attempts needed to identify',
    'stats.failed': 'Not identified',
    'stats.bestGauntlet': 'Best Five Rounds',
    'stats.bestInfinite': 'Best Endless run',
    'stats.empty': 'Nothing recorded yet. Play a daily puzzle to start.',
    'stats.reset': 'Erase all statistics',
    'stats.resetConfirm': 'Erase every recorded result? This cannot be undone.',

    // — past dailies —
    'archive.title': 'Past Dailies',
    'archive.sub':
      'The last 30 daily puzzles. Days you have already seen show their answer; the rest stay hidden. Playing one here is practice — no points, no streak.',
    'archive.empty': 'No past puzzles yet.',
    'archive.play': 'Play',
    'archive.replay': 'Play again',
    'archive.solved': 'Solved',
    'archive.lost': 'Missed',
    'archive.unplayed': 'Not played',
    'archive.seen': 'Answer seen',
    'archive.practice': 'Practice · not scored',
    'archive.withheld': 'Hidden until you play it',

    // — how to play —
    'help.title': 'How to Play',
    'help.lead':
      'Each puzzle shows one historical figure’s life reduced to two facts: where and when they were born, and where and when they died. Name that person in four attempts or fewer.',
    'help.evidence.title': '1 · What you are given',
    'help.evidence':
      'Two pins on the map: one where the person was born, one where they died. Under them are both years and the age they reached. That is everything you start with. Where a life is known by tradition rather than by record, the puzzle says so.',
    'help.attempts.title': '2 · Your four attempts',
    'help.attempts':
      'A name the game does not know costs you nothing — just try another. A real figure who is the wrong answer costs one attempt, and so does pressing Skip. Every attempt you spend reveals the next clue: first the occupation, then what the person is known for, then their initials and the length of their name.',
    'help.award.title': '3 · Points',
    'help.award':
      'Guessing right on the first attempt, before any clue, pays the most; every attempt after that pays less. Miss on the fourth and the round scores nothing.',
    'help.award.attempt': 'Attempt',
    'help.award.pays': 'Points',
    'help.award.note':
      'Figures from outside the 100 best known pay more, because they are harder to place.',
    'help.award.cause':
      'The cause of death can be revealed at any time, from the button under the death record. It spends no attempt, but it takes a quarter of whatever the round would still pay.',
    'help.editions.title': '4 · Game modes',
    'help.editions':
      'Daily Puzzle: one figure a day, the same for every player, changing at midnight UTC — the only mode that builds a streak. Five Rounds: five figures in a row, points added up. Endless Mode: figures keep coming until you miss three.',
    'help.register.title': '5 · Difficulty',
    'help.register':
      'Famous only draws from the 100 best-known figures. All figures draws from all {n}, famous and obscure alike, and pays more for the harder ones. A figure from the best-known 100 is marked wherever they appear, so you always know which you met. The Daily Puzzle ignores this setting and always uses the best-known 100.',
    'help.begin': 'Start playing',
    'help.privacy':
      'Your results and settings stay in this browser. There are no accounts, no cookies and no analytics. The only thing that leaves your device is the portrait on the answer sheet, which loads from Wikimedia; without it the game still works perfectly, offline included.',
    'help.close': 'Close',

    // — settings and menus —
    'set.sound': 'Sound',
    'set.music': 'Music',
    'set.language': 'Language',
    'set.on': 'On',
    'set.off': 'Off',
    'set.stats': 'Stats',
    'set.archive': 'Past Dailies',
    'set.help': 'How to Play',
    'set.back': 'Back',
    'set.leave': 'Quit this game',

    // — misc —
    'ui.loading': 'Loading…',
    'ui.error': 'Something went wrong.',
    'ui.errorBody': 'The game could not be loaded. Try reloading the page.',
    'ui.close': 'Close',
    'ui.skipLink': 'Skip to content',
    'ui.toolbar': 'Settings and menus',
    'ui.circa': 'c.',
    'ui.bc': 'BC',
    'ui.ad': 'AD',
  },

  pt: {
    // — cabeçalho / interface —
    'app.title': 'O Chronicle',
    'app.tagline': 'Onde os Mortos São Nomeados',
    'app.motto': 'Dois Alfinetes no Mapa · Uma Vida Entre Eles',
    'app.edition': 'Edição',
    'app.price': 'Um Vintém',

    // — modos —
    'mode.daily': 'Desafio Diário',
    'mode.daily.sub': 'Uma figura por dia, a mesma para todo mundo.',
    'mode.daily.desc':
      'Uma figura histórica, igual para todos os jogadores do mundo. Uma nova aparece à meia-noite (UTC). É o único modo que forma sequência.',
    'mode.gauntlet': 'Cinco Rodadas',
    'mode.gauntlet.sub': 'Cinco figuras seguidas. Pontos somados.',
    'mode.gauntlet.desc':
      'Cinco figuras uma após a outra, com os pontos somados em uma pontuação só. Rodada encerrada não volta.',
    'mode.infinite': 'Modo Infinito',
    'mode.infinite.sub': 'Continue até errar três.',
    'mode.infinite.desc':
      'As figuras continuam vindo até três delas derrotarem você, ficando mais difíceis ao longo do caminho. Sua melhor sequência fica salva.',
    'mode.play': 'Jogar',
    'mode.resume': 'Continuar',
    'mode.done': 'Jogado hoje',
    'mode.daily.note': 'Sempre uma das 100 figuras mais conhecidas.',
    'home.roster': 'figuras no jogo',

    // — dificuldade —
    'diff.title': 'Dificuldade',
    'diff.remarkable': 'Só as famosas',
    'diff.overall': 'Todas as figuras',
    'diff.remarkable.short': 'Famosas',
    'diff.overall.short': 'Todas',
    'diff.remarkable.note': 'As 100 figuras mais conhecidas — nomes que a maioria das pessoas reconhece.',
    'diff.overall.note': 'Todas as {n} figuras, famosas e obscuras. As menos famosas valem mais pontos.',
    'diff.applies':
      'Vale para Cinco Rodadas e Modo Infinito. O Desafio Diário usa sempre as 100 figuras mais conhecidas.',
    'hundred.badge': 'Uma das 100 mais conhecidas',
    'hundred.rank': 'N.º {n} entre as 100 mais conhecidas',

    // — rodada —
    'round.dispatch': 'Rodada',
    'round.of': 'de',
    'round.born': 'Nasceu',
    'round.died': 'Morreu',
    'round.bornAt': 'Nasceu em',
    'round.diedAt': 'Morreu em',
    'round.question': 'Quem foi esta pessoa?',
    'round.placeholder': 'Digite um nome…',
    'round.submit': 'Responder',
    'round.skip': 'Pular · −1 tentativa',
    'round.skipped': 'Pulada',
    'round.guessesLeft': 'Tentativas restantes',
    'round.attempt': 'Tentativa',
    'round.hints': 'Pistas',
    'round.noHints': 'Nenhuma pista ainda. Cada erro ou pulo revela uma.',
    'round.tradition': 'Datas tradicionais',
    'round.traditionNote':
      'As datas e os lugares desta figura são tradicionais, não documentais — são os que a história transmitiu.',
    'round.aged': 'aos',
    'round.unknownAge': 'idade desconhecida',
    'round.score': 'Pontos',
    'round.total': 'Total',
    'round.noMatch': 'Esse nome não existe no jogo — e isso não custa nada. Tente outra grafia ou outro nome.',
    'round.worth': 'vale {n} agora',
    'round.alreadyTried': 'Você já tentou esse nome.',

    // — a causa da morte: pista comprada com pontos, não com tentativa —
    'round.cause': 'Causa da morte',
    'round.causeReveal': 'Revelar a causa da morte · −{n}% dos pontos',
    'round.causeSpent': 'Revelada · −{n}% dos pontos',
    'cause.title': 'Revelar a causa da morte?',
    'cause.body':
      'O modo como esta pessoa morreu costuma ser uma pista forte, e por isso não é de graça. Se você acertar o nome depois disso, a rodada paga {after} em vez de {before}, e menos ainda a cada tentativa que você gastar. Não custa nenhuma tentativa, e não pode ser desfeito.',
    'cause.confirm': 'Revelar',
    'cause.cancel': 'Guardar os pontos',

    // — escada de pistas —
    'hint.field': 'Pista 1 · Ocupação',
    'hint.deed': 'Pista 2 · Pelo que é conhecida',
    'hint.initials': 'Pista 3 · Iniciais e tamanho do nome',
    'hint.initialsBody': 'Iniciais {initials} · {counts}.',
    'hint.letters': '{n} letras',
    'hint.letters.one': '{n} letra',

    // — folha de resposta —
    'verdict.correct': 'Acertou',
    'verdict.failed': 'Não identificada',
    'verdict.wasBorn': 'A resposta era',
    'verdict.inAttempts': 'Identificada na tentativa {n} de {max}',
    'verdict.inAttempt': 'Identificada na primeira tentativa',
    'verdict.pointsAwarded': 'Pontos ganhos',
    'verdict.noPoints': 'Nenhum ponto ganho',
    'verdict.next': 'Próxima rodada',
    'verdict.finish': 'Ver resultado',
    'verdict.lifespan': 'Viveu',
    'verdict.readMore': 'Leia mais na Wikipédia',
    'verdict.portraitCredit': 'Retrato via Wikimedia Commons',
    'verdict.years': 'anos',

    // — fim da partida —
    'summary.title': 'Resultado',
    'summary.daily': 'Desafio Diário',
    'summary.gauntlet': 'Cinco Rodadas',
    'summary.infinite': 'Modo Infinito',
    'summary.totalScore': 'Pontuação total',
    'summary.solved': 'Identificadas',
    'summary.attempts': 'Tentativas usadas',
    'summary.streak': 'Sequência atual',
    'summary.bestRun': 'Melhor sequência',
    'summary.share': 'Copiar resultado',
    'summary.shared': 'Copiado para a área de transferência',
    'summary.again': 'Jogar de novo',
    'summary.home': 'Voltar ao menu',
    'summary.perfect': 'Perfeito — todas na primeira tentativa.',
    'summary.tomorrow': 'Próximo desafio diário em {time}.',
    'summary.next': 'Próximo em',

    // — estatísticas —
    'stats.title': 'Estatísticas',
    'stats.played': 'Diários jogados',
    'stats.winRate': 'Aproveitamento',
    'stats.streak': 'Sequência',
    'stats.maxStreak': 'Melhor sequência',
    'stats.distribution': 'Tentativas até identificar',
    'stats.failed': 'Não identificadas',
    'stats.bestGauntlet': 'Melhor Cinco Rodadas',
    'stats.bestInfinite': 'Melhor Modo Infinito',
    'stats.empty': 'Nada registrado ainda. Jogue um desafio diário para começar.',
    'stats.reset': 'Apagar todas as estatísticas',
    'stats.resetConfirm': 'Apagar todos os resultados registrados? Não é possível desfazer.',

    // — diários anteriores —
    'archive.title': 'Diários Anteriores',
    'archive.sub':
      'Os 30 últimos desafios diários. Os dias que você já viu mostram a resposta; os outros ficam ocultos. Jogar aqui é treino — sem pontos e sem sequência.',
    'archive.empty': 'Ainda não há desafios anteriores.',
    'archive.play': 'Jogar',
    'archive.replay': 'Jogar de novo',
    'archive.solved': 'Acertou',
    'archive.lost': 'Não acertou',
    'archive.unplayed': 'Não jogado',
    'archive.seen': 'Resposta vista',
    'archive.practice': 'Treino · sem pontos',
    'archive.withheld': 'Oculto até você jogar',

    // — como jogar —
    'help.title': 'Como Jogar',
    'help.lead':
      'Cada desafio mostra a vida de uma figura histórica reduzida a dois fatos: onde e quando ela nasceu, e onde e quando morreu. Diga quem era em até quatro tentativas.',
    'help.evidence.title': '1 · O que você recebe',
    'help.evidence':
      'Dois alfinetes no mapa: um onde a pessoa nasceu, outro onde morreu. Abaixo deles estão os dois anos e a idade que ela alcançou. É tudo o que você tem no começo. Quando uma vida é conhecida por tradição, e não por documento, o desafio avisa.',
    'help.attempts.title': '2 · Suas quatro tentativas',
    'help.attempts':
      'Um nome que o jogo não conhece não custa nada — é só tentar outro. Uma figura real que não é a resposta custa uma tentativa, e pular custa o mesmo. Cada tentativa gasta revela a pista seguinte: primeiro a ocupação, depois pelo que a pessoa é conhecida, por fim as iniciais e o tamanho do nome.',
    'help.award.title': '3 · Pontos',
    'help.award':
      'Acertar na primeira tentativa, antes de qualquer pista, paga o máximo; cada tentativa seguinte paga menos. Errar na quarta encerra a rodada sem pontos.',
    'help.award.attempt': 'Tentativa',
    'help.award.pays': 'Pontos',
    'help.award.note':
      'Figuras de fora das 100 mais conhecidas pagam mais, por serem mais difíceis de situar.',
    'help.award.cause':
      'A causa da morte pode ser revelada a qualquer momento, no botão sob o registro de morte. Não gasta tentativa, mas retira um quarto do que a rodada ainda pagaria.',
    'help.editions.title': '4 · Modos de jogo',
    'help.editions':
      'Desafio Diário: uma figura por dia, a mesma para todos, trocada à meia-noite (UTC) — é o único modo que forma sequência. Cinco Rodadas: cinco figuras seguidas, com os pontos somados. Modo Infinito: as figuras continuam até você errar três.',
    'help.register.title': '5 · Dificuldade',
    'help.register':
      'Só as famosas sorteia entre as 100 figuras mais conhecidas. Todas as figuras sorteia entre as {n}, famosas e obscuras, e paga mais pelas mais difíceis. Uma figura das 100 mais conhecidas é marcada onde quer que apareça, para você sempre saber qual encontrou. O Desafio Diário ignora este ajuste e usa sempre as 100 mais conhecidas.',
    'help.begin': 'Começar a jogar',
    'help.privacy':
      'Seus resultados e ajustes ficam somente neste navegador. Não há contas, cookies nem análise de tráfego. A única coisa que sai do seu aparelho é o retrato na folha de resposta, carregado da Wikimedia; sem ele o jogo funciona perfeitamente, inclusive offline.',
    'help.close': 'Fechar',

    // — ajustes e menus —
    'set.sound': 'Som',
    'set.music': 'Música',
    'set.language': 'Idioma',
    'set.on': 'Ligado',
    'set.off': 'Desligado',
    'set.stats': 'Estatísticas',
    'set.archive': 'Diários Anteriores',
    'set.help': 'Como Jogar',
    'set.back': 'Voltar',
    'set.leave': 'Sair deste jogo',

    // — diversos —
    'ui.loading': 'Carregando…',
    'ui.error': 'Algo deu errado.',
    'ui.errorBody': 'Não foi possível carregar o jogo. Tente recarregar a página.',
    'ui.close': 'Fechar',
    'ui.skipLink': 'Pular para o conteúdo',
    'ui.toolbar': 'Ajustes e menus',
    'ui.circa': 'c.',
    'ui.bc': 'a.C.',
    'ui.ad': 'd.C.',
  },
};

/**
 * Occupation descriptors — the first clue. Written as a newspaper would
 * describe a person's calling rather than as a job title, so the clue narrows
 * the field without naming the trade outright. This is the one place the
 * flourish is the point: the clue header above it already says "Occupation".
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
  composer:     { en: 'A setter of music upon the page.',       pt: 'Alguém que dispôs notas sobre a pauta.' },
  musician:     { en: 'A maker of song.',                       pt: 'Um criador de canções.' },
  writer:       { en: 'A worker in ink and paper.',             pt: 'Um trabalhador da tinta e do papel.' },
  economist:    { en: 'A student of wealth and want.',          pt: 'Um estudioso da riqueza e da escassez.' },
  industrialist:{ en: 'A master of trade and manufacture.',     pt: 'Um senhor do comércio e da indústria.' },
  nurse:        { en: 'A tender of the wounded.',               pt: 'Um cuidador dos feridos.' },
  athlete:      { en: 'A contender in the arena.',              pt: 'Um competidor na arena.' },
  filmmaker:    { en: 'A worker in moving pictures.',           pt: 'Um trabalhador das imagens em movimento.' },
  outlaw:       { en: 'A defier of the law.',                   pt: 'Um desafiador da lei.' },
};

/** Every key defined for a language. Used by tools/check.mjs to prove parity. */
export function keysFor(lang) {
  return Object.keys(STRINGS[lang] ?? {});
}

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

/** Grammatical plural for the letter-count clue. */
export function letterCount(n) {
  return t(n === 1 ? 'hint.letters.one' : 'hint.letters', { n });
}

/** Pick the localised half of a `[en, pt]` pair, or pass a plain string through. */
export function pick(value) {
  if (Array.isArray(value)) return value[current === 'pt' ? 1 : 0] ?? value[0];
  return value;
}

/** Occupation descriptor for the first clue. */
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

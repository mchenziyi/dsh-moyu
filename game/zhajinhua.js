/**
 * 炸金花 (three-card brag) rules and authoritative hand state.
 *
 * Pure rules: no network, no timers, no randomness beyond the injected RNG.
 * The Host game server owns one instance per room; clients only render
 * `stateFor(seat)` and submit actions.
 *
 * Hand types, high to low:
 *   豹子 (three of a kind) > 同花顺 (straight flush) > 同花 (flush)
 *   > 顺子 (straight) > 对子 (pair) > 单张 (high card)
 * A23 is the lowest straight; QKA is the highest.
 */

export const SUITS = ['S', 'H', 'D', 'C'];
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const HAND_TYPE_NAMES = {
  6: '豹子',
  5: '同花顺',
  4: '同花',
  3: '顺子',
  2: '对子',
  1: '单张',
};

export const DEFAULT_CONFIG = {
  ante: 10,
  initialChips: 1000,
  raiseStep: 10,
  maxRounds: 20,
  compareFromRound: 2,
  turnTimeoutMs: 30000,
  minPlayers: 2,
  maxPlayers: 6,
  seenMultiplier: 2,
};

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) deck.push({ suit, rank });
  }
  return deck;
}

export function shuffle(deck, random = Math.random) {
  const copy = deck.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function sortedRanks(cards) {
  return cards.map((card) => card.rank).sort((a, b) => b - a);
}

function straightHigh(ranks) {
  const unique = [...new Set(ranks)];
  if (unique.length !== 3) return 0;
  const [high, middle, low] = unique;
  if (high - middle === 1 && middle - low === 1) return high;
  // A23 is the lowest straight.
  if (high === 14 && middle === 3 && low === 2) return 3;
  return 0;
}

/** Evaluate exactly three cards. */
export function evaluateHand(cards) {
  if (!Array.isArray(cards) || cards.length !== 3) throw new Error('evaluateHand expects 3 cards');
  const ranks = sortedRanks(cards);
  const counts = new Map();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const high = straightHigh(ranks);
  const straight = high > 0;

  if (counts.size === 1) {
    return { type: 6, name: HAND_TYPE_NAMES[6], ranks };
  }
  if (flush && straight) {
    return { type: 5, name: HAND_TYPE_NAMES[5], ranks: [high] };
  }
  if (flush) {
    return { type: 4, name: HAND_TYPE_NAMES[4], ranks };
  }
  if (straight) {
    return { type: 3, name: HAND_TYPE_NAMES[3], ranks: [high] };
  }
  if (counts.size === 2) {
    const pairRank = [...counts.entries()].find(([, count]) => count === 2)[0];
    const kicker = [...counts.entries()].find(([, count]) => count === 1)[0];
    return { type: 2, name: HAND_TYPE_NAMES[2], ranks: [pairRank, kicker] };
  }
  return { type: 1, name: HAND_TYPE_NAMES[1], ranks };
}

/** Compare two evaluated hands: >0 when a wins, <0 when b wins, 0 on a tie. */
export function compareEvaluated(a, b) {
  if (a.type !== b.type) return a.type - b.type;
  for (let index = 0; index < Math.max(a.ranks.length, b.ranks.length); index += 1) {
    const left = a.ranks[index] ?? 0;
    const right = b.ranks[index] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

export function compareHands(aCards, bCards) {
  return compareEvaluated(evaluateHand(aCards), evaluateHand(bCards));
}

/** Whole-number cost one player owes for an action. */
export function actionCost(game, seat, kind) {
  const player = game.players[seat];
  if (player === undefined) return 0;
  const multiplier = player.seen ? game.config.seenMultiplier : 1;
  if (kind === 'raise') return (game.currentBet + game.config.raiseStep) * multiplier;
  return game.currentBet * multiplier;
}

function activeSeats(game) {
  return game.players.filter((player) => player.inHand && !player.folded).map((player) => player.seat);
}

function nextActiveSeat(game, from) {
  const players = game.players;
  for (let offset = 1; offset <= players.length; offset += 1) {
    const seat = (from + offset) % players.length;
    const player = players[seat];
    if (player.inHand && !player.folded) return seat;
  }
  return -1;
}

function firstActiveSeat(game) {
  for (const player of game.players) {
    if (player.inHand && !player.folded) return player.seat;
  }
  return -1;
}

function pushLog(game, message) {
  game.log.push(message);
  if (game.log.length > 60) game.log.splice(0, game.log.length - 60);
}

function finish(game, reason) {
  const remaining = activeSeats(game);
  let winners = [];
  let reveal = true;
  if (remaining.length === 1) {
    winners = remaining;
  } else {
    const ranked = remaining.map((seat) => ({
      seat,
      hand: evaluateHand(game.players[seat].hand),
    })).sort((a, b) => compareEvaluated(b.hand, a.hand));
    const best = ranked[0];
    winners = ranked.filter((entry) => compareEvaluated(entry.hand, best.hand) === 0).map((entry) => entry.seat);
  }
  const share = Math.floor(game.pot / winners.length);
  let remainder = game.pot - share * winners.length;
  for (const seat of winners) {
    const bonus = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    game.players[seat].chips += share + bonus;
  }
  game.status = 'settled';
  game.winnerSeats = winners;
  game.result = {
    reason,
    winners,
    hands: reveal ? game.players.map((player) => ({
      seat: player.seat,
      name: player.name,
      cards: player.inHand ? player.hand.slice() : [],
      folded: player.folded || !player.inHand,
      evaluated: player.inHand ? evaluateHand(player.hand) : null,
    })) : [],
    pot: game.pot,
  };
  game.pot = 0;
  game.turnSeat = -1;
  pushLog(game, `本局结束：${winners.map((seat) => game.players[seat].name).join('、')} 赢得 ${game.result.pot}`);
}

function advanceTurn(game, actedSeat) {
  const player = game.players[actedSeat];
  if (player !== undefined) player.acted = true;
  if (activeSeats(game).length <= 1) {
    finish(game, '只剩一名玩家');
    return;
  }
  const active = activeSeats(game);
  const allActed = active.every((seat) => game.players[seat].acted);
  if (allActed) {
    game.round += 1;
    if (game.round > game.config.maxRounds) {
      finish(game, '达到最大轮数');
      return;
    }
    for (const seat of active) game.players[seat].acted = false;
    game.turnSeat = firstActiveSeat(game);
    pushLog(game, `第 ${game.round} 轮`);
    return;
  }
  game.turnSeat = nextActiveSeat(game, actedSeat);
}

export class ZhaJinHuaGame {
  constructor(players, config = {}, random = Math.random) {
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
    this.random = random;
    this.handNo = 0;
    this.status = 'waiting';
    this.players = players.map((player) => ({
      seat: player.seat,
      name: String(player.name ?? `玩家${player.seat + 1}`).slice(0, 16),
      chips: Number.isInteger(player.chips) ? player.chips : this.config.initialChips,
      hand: [],
      seen: false,
      folded: false,
      inHand: false,
      acted: false,
      online: player.online !== false,
    }));
    this.pot = 0;
    this.currentBet = this.config.ante;
    this.round = 0;
    this.turnSeat = -1;
    this.log = [];
    this.winnerSeats = [];
    this.result = null;
    this.dealerSeat = -1;
  }

  startHand() {
    const eligible = this.players.filter((player) => player.chips >= this.config.ante && player.online !== false);
    if (eligible.length < this.config.minPlayers) throw new Error('筹码足够的玩家不足');
    this.handNo += 1;
    this.status = 'playing';
    this.pot = 0;
    this.currentBet = this.config.ante;
    this.round = 1;
    this.winnerSeats = [];
    this.result = null;
    this.log = [];
    const deck = shuffle(createDeck(), this.random);
    let cursor = 0;
    for (const player of this.players) {
      player.seen = false;
      player.folded = false;
      player.acted = false;
      player.hand = [];
      player.inHand = player.chips >= this.config.ante && player.online !== false;
      if (!player.inHand) {
        player.folded = true;
        continue;
      }
      player.chips -= this.config.ante;
      this.pot += this.config.ante;
      player.hand = [deck[cursor], deck[cursor + 1], deck[cursor + 2]];
      cursor += 3;
    }
    const seats = this.players.filter((player) => player.inHand).map((player) => player.seat);
    const start = seats[Math.floor(this.random() * seats.length)];
    this.turnSeat = start;
    pushLog(this, `第 ${this.handNo} 局开始，底注 ${this.config.ante}，当前注 ${this.currentBet}`);
    return this;
  }

  nextHand() {
    return this.startHand();
  }

  player(seat) {
    return this.players[seat];
  }

  act(seat, action) {
    if (this.status !== 'playing') throw new Error('本局还没有开始');
    if (this.turnSeat !== seat) throw new Error('还没轮到你');
    const player = this.players[seat];
    if (player === undefined || !player.inHand || player.folded) throw new Error('你已不在本局中');
    const kind = typeof action === 'string' ? action : String(action?.kind ?? '');
    const target = typeof action === 'object' ? Number(action?.target) : undefined;
    switch (kind) {
      case 'look': {
        if (player.seen) throw new Error('已经看过牌了');
        player.seen = true;
        pushLog(this, `${player.name} 看牌`);
        return;
      }
      case 'fold': {
        player.folded = true;
        player.acted = true;
        pushLog(this, `${player.name} 弃牌`);
        advanceTurn(this, seat);
        return;
      }
      case 'call': {
        const cost = actionCost(this, seat, 'call');
        if (player.chips < cost) throw new Error(`筹码不足，跟注需要 ${cost}`);
        player.chips -= cost;
        this.pot += cost;
        pushLog(this, `${player.name} 跟注 ${cost}`);
        advanceTurn(this, seat);
        return;
      }
      case 'raise': {
        const nextBet = this.currentBet + this.config.raiseStep;
        const cost = nextBet * (player.seen ? this.config.seenMultiplier : 1);
        if (player.chips < cost) throw new Error(`筹码不足，加注需要 ${cost}`);
        player.chips -= cost;
        this.pot += cost;
        this.currentBet = nextBet;
        pushLog(this, `${player.name} 加注到 ${nextBet}（支付 ${cost}）`);
        advanceTurn(this, seat);
        return;
      }
      case 'compare': {
        if (this.round < this.config.compareFromRound) throw new Error(`第 ${this.config.compareFromRound} 轮后才能比牌`);
        if (!Number.isInteger(target) || target === seat) throw new Error('请选择比牌对象');
        const other = this.players[target];
        if (other === undefined || !other.inHand || other.folded) throw new Error('比牌对象不在本局中');
        const cost = actionCost(this, seat, 'call');
        if (player.chips < cost) throw new Error(`筹码不足，比牌需要 ${cost}`);
        player.chips -= cost;
        this.pot += cost;
        const challenger = evaluateHand(player.hand);
        const defender = evaluateHand(other.hand);
        const result = compareEvaluated(challenger, defender);
        if (result > 0) {
          other.folded = true;
          pushLog(this, `${player.name} 与 ${other.name} 比牌，${player.name} 胜`);
        } else {
          player.folded = true;
          pushLog(this, `${player.name} 与 ${other.name} 比牌，${other.name} 胜`);
        }
        advanceTurn(this, seat);
        return;
      }
      default:
        throw new Error(`未知动作：${kind}`);
    }
  }

  /** Mark a disconnected/leaving player as folded; advance if it was their turn. */
  forceFold(seat) {
    if (this.status !== 'playing') return;
    const player = this.players[seat];
    if (player === undefined || !player.inHand || player.folded) return;
    player.folded = true;
    player.acted = true;
    pushLog(this, `${player.name} 离开/掉线，自动弃牌`);
    if (this.turnSeat === seat) {
      advanceTurn(this, seat);
    } else if (activeSeats(this).length <= 1) {
      finish(this, '只剩一名玩家');
    }
  }

  setOnline(seat, online) {
    const player = this.players[seat];
    if (player !== undefined) player.online = online !== false;
  }

  /** Serializable snapshot for Durable Object persistence. */
  toJSON() {
    return {
      config: this.config,
      players: this.players.map((player) => ({
        seat: player.seat,
        name: player.name,
        chips: player.chips,
        hand: player.hand.map((card) => ({ suit: card.suit, rank: card.rank })),
        seen: player.seen,
        folded: player.folded,
        inHand: player.inHand,
        acted: player.acted,
        online: player.online,
      })),
      handNo: this.handNo,
      status: this.status,
      pot: this.pot,
      currentBet: this.currentBet,
      round: this.round,
      turnSeat: this.turnSeat,
      log: this.log.slice(),
      winnerSeats: this.winnerSeats.slice(),
      result: this.result,
      dealerSeat: this.dealerSeat,
    };
  }

  static fromJSON(data, random = Math.random) {
    const game = Object.create(ZhaJinHuaGame.prototype);
    Object.assign(game, data);
    game.random = random;
    return game;
  }

  /** One viewer's snapshot. Other players' cards are never included. */
  stateFor(seat) {
    const viewer = this.players[seat];
    const reveal = this.status === 'settled';
    return {
      handNo: this.handNo,
      status: this.status,
      pot: this.pot,
      currentBet: this.currentBet,
      round: this.round,
      turnSeat: this.turnSeat,
      yourSeat: seat,
      yourCards: viewer !== undefined && (viewer.seen || reveal) ? viewer.hand.slice() : [],
      yourSeen: viewer !== undefined ? viewer.seen : false,
      players: this.players.map((player) => ({
        seat: player.seat,
        name: player.name,
        chips: player.chips,
        seen: player.seen,
        folded: player.folded,
        inHand: player.inHand,
        online: player.online,
        cards: reveal && player.inHand && !player.folded ? player.hand.slice() : [],
      })),
      log: this.log.slice(-12),
      result: this.result,
      config: {
        ante: this.config.ante,
        raiseStep: this.config.raiseStep,
        compareFromRound: this.config.compareFromRound,
        maxRounds: this.config.maxRounds,
        seenMultiplier: this.config.seenMultiplier,
      },
    };
  }
}

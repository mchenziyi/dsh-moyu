import { createDeck, evaluateHand, compareHands, ZhaJinHuaGame } from '../game/zhajinhua.js';

const failures = [];
const card = (suit, rank) => ({ suit, rank });
const check = (name, condition) => { if (!condition) failures.push(name); };

const deck = createDeck();
check('deck size', deck.length === 52);
check('deck unique', new Set(deck.map((entry) => `${entry.suit}${entry.rank}`)).size === 52);

const baozi = evaluateHand([card('S', 9), card('H', 9), card('D', 9)]);
const tonghuashun = evaluateHand([card('S', 10), card('S', 11), card('S', 12)]);
const tonghua = evaluateHand([card('S', 2), card('S', 7), card('S', 13)]);
const shunzi = evaluateHand([card('S', 10), card('H', 11), card('D', 12)]);
const duizi = evaluateHand([card('S', 8), card('H', 8), card('D', 2)]);
const danzhang = evaluateHand([card('S', 14), card('H', 9), card('D', 2)]);
const lowStraight = evaluateHand([card('S', 14), card('H', 2), card('D', 3)]);
check('types', baozi.type === 6 && tonghuashun.type === 5 && tonghua.type === 4 && shunzi.type === 3 && duizi.type === 2 && danzhang.type === 1);
check('A23 straight', lowStraight.type === 3 && lowStraight.ranks[0] === 3);
check('QKA highest straight', compareHands([card('S', 12), card('H', 13), card('D', 14)], [card('S', 10), card('H', 11), card('D', 12)]) > 0);
check('baozi beats flush', compareHands([card('S', 2), card('H', 2), card('D', 2)], [card('S', 14), card('S', 13), card('S', 12)]) > 0);
check('pair kicker', compareHands([card('S', 8), card('H', 8), card('D', 14)], [card('S', 8), card('H', 8), card('D', 13)]) > 0);

const game = new ZhaJinHuaGame([
  { seat: 0, name: 'A', chips: 1000 },
  { seat: 1, name: 'B', chips: 1000 },
  { seat: 2, name: 'C', chips: 1000 },
], { ante: 10, raiseStep: 10, maxRounds: 5 }, () => 0.5);
game.startHand();
check('hand dealt', game.players.every((player) => player.hand.length === 3));
check('ante pot', game.pot === 30);
check('turn set', game.turnSeat >= 0);
const turn = game.turnSeat;
game.act(turn, 'look');
check('seen', game.players[turn].seen === true);
game.act(turn, 'call');
check('call advanced', game.turnSeat !== turn || game.status === 'settled');
game.act(game.turnSeat, 'fold');
check('fold', game.players.some((player) => player.folded));

const showdown = new ZhaJinHuaGame([
  { seat: 0, name: 'A', chips: 100 },
  { seat: 1, name: 'B', chips: 100 },
], { ante: 10, initialChips: 100, maxRounds: 1 }, () => 0.2);
showdown.startHand();
showdown.players[0].hand = [card('S', 14), card('H', 14), card('D', 14)];
showdown.players[1].hand = [card('S', 2), card('H', 3), card('D', 4)];
const first = showdown.turnSeat;
showdown.act(first, 'fold');
check('settled on fold', showdown.status === 'settled');
check('winner', showdown.winnerSeats.length === 1);

console.log('evaluator:', baozi.name, tonghuashun.name, tonghua.name, shunzi.name, duizi.name, danzhang.name);
console.log('game:', game.status, game.pot, game.log.slice(-3).join(' | '));
console.log(failures.length === 0 ? 'game rules OK' : 'FAILED: ' + failures.join(' | '));
process.exit(failures.length === 0 ? 0 : 1);

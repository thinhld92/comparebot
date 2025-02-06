const Action = Object.freeze({
  NONE: 1,
  BUY: 2,
  SELL: 3,
  CLOSE_BUY: 4,
  CLOSE_SELL: 5,
  CANCELED: 6
});

module.exports = Action;
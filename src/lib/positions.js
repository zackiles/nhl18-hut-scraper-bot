import _ from 'lodash';

const AH_CARDS = {};

const AH_CARD_DATA = {
  playerName: {
    x: 13,
    y: 194,
    width: 218,
    height: 35
  },
  stats: {
    x: 18,
    y: 273,
    width: 210,
    height: 25
  }
};

const AH_BIDDING_INFO = {
  currentBid: {
    x: 473,
    y: 951,
    width: 214,
    height: 25
  },
  buyNowPrice: {
    x: 708,
    y: 951,
    width: 214,
    height: 25
  },
  startPrice: {
    x: 940,
    y: 951,
    width: 214,
    height: 25
  },
  timeRemaining: {
    x: 1174,
    y: 951,
    width: 214,
    height: 25
  },
  contractLength: {
    x: 1405,
    y: 951,
    width: 214,
    height: 25
  },
  seller: {
    x: 1640,
    y: 951,
    width: 214,
    height: 25
  }
};

const firstCard = {
  x: 142,
  y: 236,
  width: 240,
  height: 300
};

let lastCard = {};
const cardSpacing = 230;

// Loop through the 14 cards displayed on an AH
// getting their unique x/y position and width/height
// We do this with some simple math, a startion position
// and the average "cardSpacing" between cards.
for(var i=0; i < 14; i++){
  const name = `card${i + 1}`;
  AH_CARDS[name] = _.clone(firstCard);
  AH_CARDS[name].name = name;
  if (i !== 0 && i <=7 ) {
    if (i !== 0) {
      AH_CARDS[name].x = lastCard.x + cardSpacing;
    }
  };
  if (i >= 7) {
    AH_CARDS[name].y = 570;
    if (i === 7) {
      AH_CARDS[name].x = firstCard.x;
    } else {
      AH_CARDS[name].x = lastCard.x + cardSpacing;
    }
  }
  lastCard = AH_CARDS[name];
}

export default {AH_CARDS, AH_CARD_DATA, AH_BIDDING_INFO};
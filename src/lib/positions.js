import _ from 'lodash';

const AH_CARDS = {};

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

export default {AH_CARDS};
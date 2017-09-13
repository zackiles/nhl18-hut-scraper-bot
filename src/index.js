import path from 'path';
import fs from 'fs-extra';
import activeWin from 'active-win';
import Tesseract from 'node-tesseract'
import GM from 'gm';
import Jimp from  'jimp';
import robot from 'robotjs';
import moment from 'moment';
import numeral from 'numeral';
import bootstrap from './bootstrap';
import positions from './lib/positions';
import request from './lib/request';

const TESSERACT_PATH = "C:\\Tesseract-OCR\\tesseract.exe";
const gm = GM.subClass({appPath: 'C:\\Program Files\\GraphicsMagick-1.3.26-Q8\\'});
const dataDirectory = path.resolve(__dirname, 'data');

let xboxWindowActive = false;

function checkForXboxWindow() {
  activeWin().then(window => {
    if(window.app === 'ApplicationFrameHost.exe' && window.title === 'Xbox'){
      xboxWindowActive = true;
      log.debug('Xbox window open');
      captureScreen().then(image => {
        getTextFromImage(image, true).then(text => {
          log.info('text', text);
        });
      });
    }else{
      log.debug('Xbox window closed', window)
      xboxWindowActive = false;
    }
  });
}

function captureScreen() {
  const {height, width} = robot.getScreenSize();
  const bitmap = robot.screen.capture(0, 0, width, height);
  return new Promise((resolve, reject) => {
    
    new Jimp(bitmap.width, bitmap.height, function(err, img) {
      img.bitmap.data = bitmap.image;
      img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
        var red   = img.bitmap.data[ idx + 0 ];
        var blue  = img.bitmap.data[ idx + 2 ];
        img.bitmap.data[ idx + 0 ] = blue;
        img.bitmap.data[ idx + 2 ] = red;
      });
      img.resize(bitmap.width * 2.5, bitmap.height * 2.5, Jimp.RESIZE_BEZIER);
      img.dither565(); 
      img.normalize();  
      img.grayscale();

      const file = path.resolve(__dirname, `./sc${Date.now()}.png`);
      img.write(file, () => {
        resolve(file);
      });
    });
  });
}

function getTextFromImage(file, shouldRemove, psm = 7) {
  const options = {
    binary: TESSERACT_PATH,
    psm: psm,
    lang: 'en'
  };
  const cleanupText = (text) => {
    if(!text) return text;
    text = text.replace(/(\r\n|\n|\r)/gm,"").trim();
    if(text === '§') text = '5';
    return text;
  };
  const promise = Promise.promisify(Tesseract.process);
  return promise(file, options).then(results => {
    results = cleanupText(results);
    if(shouldRemove){
      return fs.remove(file).then(() => {
        return results;
      });
    }else{
      return results;
    }
  });
}

//setInterval(checkForXboxWindow, 5000);

//getTextFromImage(path.resolve(__dirname, 'images\\AH-2-splice1.png')).then(results => {
  //console.log(results)
//})
/** 
preProcessImage(path.resolve(__dirname, 'images\\AH-3-splice1.png'))
.then(results => {
  return getTextFromImage(path.resolve(__dirname, 'processed.png'));
})
.then(results => {
  console.log(results)
});*/

function preProcessImage(input, output) {
  return new Promise((resolve, reject) => {
    gm(input)
    .channel("gray")
    .unsharp(6.8, 2.69, 0, 0)
    .write(output, (err) => {
      return err ? reject(err) : resolve(output);
    });
  });
}

function spliceAuctionHouse(ahScreenshotFile) {
  return Jimp.read(ahScreenshotFile).then(img => {
    return Promise.map(_.map(positions.AH_CARDS), card => {
      const clone = img.clone();
        // Slice out a speicifc segment of the image
        clone.crop(card.x, card.y, card.width, card.height)
        // Enlarge it (for better OCR detection)
        //.resize(clone.bitmap.width * 2, clone.bitmap.height * 2, Jimp.AUTO);
      let sliceFile = path.parse(ahScreenshotFile).name + `-${card.name}.png`;
      sliceFile = path.resolve(dataDirectory, sliceFile);
      return new Promise((resolve, reject) => {
        clone.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
          return err ? reject(err) : preProcessImage(buffer, sliceFile).then(resolve);
        });
      });
    }, {concurrency: 1});
  });
}

function getCardData(ahScreenshotFile, cardName, widthMultiplyer = 2, heightMultiplier = 2) {
  const getText = (img, type) => {
    const sliceFilePath = path.resolve(dataDirectory,`${cardName}-${type}.png`);
    return new Promise((resolve, reject) => {
      img.resize(img.bitmap.width * widthMultiplyer, img.bitmap.height * heightMultiplier, Jimp.RESIZE_BEZIER);
      img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
        if(err) return reject(err);
        preProcessImage(buffer, sliceFilePath).then(getTextFromImage).then(resolve);
      });
    });
  };
  return Jimp.read(ahScreenshotFile).then(img => {
    const ah = img.clone();
    const cardPos = positions.AH_CARDS[cardName];
    const playerPos = positions.AH_CARD_DATA.playerName;
    const statsPos = positions.AH_CARD_DATA.stats;
    const currentBidPos = positions.AH_BIDDING_INFO.currentBid;
    const buyNowPos = positions.AH_BIDDING_INFO.buyNowPrice;
    const startPricePos = positions.AH_BIDDING_INFO.startPrice;
    const timePos = positions.AH_BIDDING_INFO.timeRemaining;
    const contractPos = positions.AH_BIDDING_INFO.contractLength;
    const sellerPos = positions.AH_BIDDING_INFO.seller;

    const card = ah.crop(cardPos.x, cardPos.y, cardPos.width, cardPos.height);
    const playerName = card.clone().crop(playerPos.x, playerPos.y, playerPos.width, playerPos.height);
    const stats = card.clone().crop(statsPos.x, statsPos.y, statsPos.width, statsPos.height);
    const currentBid = img.clone().crop(currentBidPos.x, currentBidPos.y, currentBidPos.width, currentBidPos.height);
    const buyNowPrice = img.clone().crop(buyNowPos.x, buyNowPos.y, buyNowPos.width, buyNowPos.height);
    const startPrice = img.clone().crop(startPricePos.x, startPricePos.y, startPricePos.width, startPricePos.height);
    const timeRemaining = img.clone().crop(timePos.x, timePos.y, timePos.width, timePos.height);
    const contractLength = img.clone().crop(contractPos.x, contractPos.y, contractPos.width, contractPos.height);
    const seller = img.clone().crop(sellerPos.x, sellerPos.y, sellerPos.width, sellerPos.height);

    return Promise.props({
      playerName: getText(playerName, 'playername'),
      stats: getText(stats, 'stats'),
      currentBid: getText(currentBid, 'currentbid', 10, 10),
      buyNowPrice: getText(buyNowPrice, 'buynowprice', 10, 10),
      startPrice: getText(startPrice, 'startprice', 10, 10),
      timeRemaining: getText(timeRemaining, 'timeremaining', 10, 10),
      contractLength: getText(contractLength, 'contractlength', 10, 10),
      seller: getText(seller, 'seller', 10, 10)
    })
    .then(player => {
      player.stats = player.stats.split(' ');
      player.currentBid = numeral(player.currentBid).value();
      player.buyNowPrice = numeral(player.buyNowPrice).value();
      player.startPrice = numeral(player.startPrice).value();
      player.timeRemaining = player.timeRemaining.split(' ');
      player.expiresTime = moment();
      player.timeRemaining.forEach(time => {
        if(time.includes('m')){
          player.expiresTime = player.expiresTime.add(numeral(time), 'm');
        }
        if(time.includes('s')){
          player.expiresTime = player.expiresTime.add(numeral(time), 'm');
        }
      });
      return player;
    });
  });
}

getCardData(path.resolve(__dirname, 'images\\AH-2.png'), 'card1')
.then(results => {
  console.log(results)
})
.catch(log.error);
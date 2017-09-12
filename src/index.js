import path from 'path';
import fs from 'fs-extra';
import activeWin from 'active-win';
import Tesseract from 'node-tesseract'
import Jimp from  'jimp';
import robot from 'robotjs';
import bootstrap from './bootstrap';
import positions from './lib/positions';

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
      img.resize(bitmap.width * 2, bitmap.height * 2, Jimp.RESIZE_BEZIER);
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

function getTextFromImage(file, shouldRemove) {
  const options = {
    binary: "C:\\Tesseract-OCR\\tesseract.exe",
    psm: 3
  };
  const promise = Promise.promisify(Tesseract.process);
  return promise(file, options).then(results => {
    if(shouldRemove){
      return fs.remove(file).then(() => {
        return results;
      });
    }else{
      return results;
    }
  });
}

function preProcessImage(file) {
  return Jimp.read(file).then(img => {
    log.info('increasing size to ', img.bitmap.width*2, 'and height to', img.bitmap.height*2,)
    return img.resize(img.bitmap.width*2, img.bitmap.height*2, Jimp.RESIZE_BEZIER)
    .greyscale()
    .write('./processed.png');
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

function spliceAuctionHouse(ahScreenshotFile) {
  return Jimp.read(ahScreenshotFile).then(img => {
    return Promise.map(_.map(positions.AH_CARDS), card => {
      const clone = img.greyscale().clone();
        // Slice out a speicifc segment of the image
        clone.crop(card.x, card.y, card.width, card.height)
        // Enlarge it (for better OCR detection)
        .resize(clone.bitmap.width * 2, clone.bitmap.height * 2, Jimp.RESIZE_BEZIER);
      let sliceFile = path.parse(ahScreenshotFile).name + `-${card.name}.png`;
      sliceFile = path.resolve(dataDirectory, sliceFile);
      clone.write(sliceFile);
      return new Promise((resolve, reject) => {
        clone.write(sliceFile, (err, results) => {
          return err ? reject(err) : resolve(sliceFile);
        });
      });
    });
  });
}

spliceAuctionHouse(path.resolve(__dirname, 'images\\AH-2.png'))
.then(results => {
  log.info(results)
})
.catch(log.error);
import fs from 'fs';
import Audic from 'audic';
import inquirer from 'inquirer';

const files = fs.readdirSync('./public/announcements');
let audioInfo = JSON.parse(fs.readFileSync('./public/audioInfo.json', {encoding: 'utf8'}));

// event loop
(async () => {

})();

const audic = new Audic('./audio.mp3');

await audic.play();

audic.addEventListener('ended', () => {
    audic.destroy();
});
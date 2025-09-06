import fs from 'fs';
import Fuse from 'fuse.js';

const audioInfoRaw = JSON.parse(fs.readFileSync('./audioInfoRaw.json', {encoding: 'utf8'}));

let audioInfoDict = {};

const audioInfoList = Object.keys(audioInfoRaw).map((fileID, i) => {
  audioInfoDict[fileID] = {
    id: fileID,
    path: `/announcements/${fileID}.wav`,
    text: audioInfoRaw[fileID].text,
    textLower: audioInfoRaw[fileID].text.toLowerCase(), 
  }

  return {
    id: fileID,
    index: i,
    path: `/announcements/${fileID}.wav`,
    text: audioInfoRaw[fileID].text,
    textLower: audioInfoRaw[fileID].text.toLowerCase(),
  }
});

fs.writeFileSync('./src/audioMeta/audioInfoList.json', JSON.stringify(audioInfoList, null, 2), {encoding: 'utf8'});
fs.writeFileSync('./src/audioMeta/audioInfoDict.json', JSON.stringify(audioInfoDict, null, 2), {encoding: 'utf8'});
fs.writeFileSync('./public/audioInfoList.json', JSON.stringify(audioInfoList, null, 2), {encoding: 'utf8'});
fs.writeFileSync('./public/audioInfoDict.json', JSON.stringify(audioInfoDict, null, 2), {encoding: 'utf8'});
import fs from 'fs';
import Audic from 'audic';
import inquirer from 'inquirer';

const files = fs.readdirSync('./public/announcements');
let audioInfo = JSON.parse(fs.readFileSync('./public/audioInfo.json', { encoding: 'utf8' }));

// event loop
(async () => {
  let lastInput = '';

  while (true) {
    const firstUnidentifiedFile = files.find((fileName) => !audioInfo[fileName.split('.')[0]]);

    if (!firstUnidentifiedFile) break; // no more

    const audic = new Audic(`./public/announcements/${firstUnidentifiedFile}`);
    audic.play();
    //await audic.destroy();

    console.log(`Already identified ${Object.keys(audioInfo).length}/${files.length} (${((Object.keys(audioInfo).length / files.length) * 100).toFixed(2)}%)`)

    await inquirer
      .prompt([{ name: 'answer', message: `File '${firstUnidentifiedFile}'` }])
      .then((answers) => {
        const answer = answers['answer'];
        audic.destroy();

        if (answer.endsWith('EXIT')) process.exit(0)
        else if (answer.endsWith('REPLAY')) {
          lastInput += answer.split('REPLAY')[0]; // loop
        } else if (answer.startsWith('COPY')) {
          const fromID = answer.split(' ')[1];
          const audioID = firstUnidentifiedFile.split('.')[0];
          console.log(audioInfo[fromID].text)
          audioInfo[audioID] = {
            text: audioInfo[fromID].text,
            alternatives: [],
          };
          lastInput = '';
          fs.writeFileSync('./public/audioInfo.json', JSON.stringify(audioInfo, null, 2), { encoding: 'utf8' });
        } else {
          const audioID = firstUnidentifiedFile.split('.')[0];
          console.log(lastInput + answer);
          audioInfo[audioID] = {
            text: lastInput + answer,
            alternatives: [],
          };
          lastInput = '';
          fs.writeFileSync('./public/audioInfo.json', JSON.stringify(audioInfo, null, 2), { encoding: 'utf8' });
        }
      })
      .catch((e) => {
        console.log(e)
        process.exit(0);
        // user probably exited, silently return
      })
  }
})();
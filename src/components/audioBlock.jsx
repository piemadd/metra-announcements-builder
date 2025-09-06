import audioInfoDict from '../audioMeta/audioInfoDict.json';

const colorSets = [
  ['#eb4034', '#85241d'],
  ['#eb7a34', '#85451d'],
  ['#ebd034', '#85751d'],
  ['#a8eb34', '#5f851d'],
  ['#34eb3a', '#1d8520'],
  ['#34eba5', '#1d855d'],
  ['#34d0eb', '#1d7585'],
  ['#3440eb', '#1d2485'],
  ['#7a34eb', '#451d85'],
  ['#eb34e8', '#851d83'],
];

const AudioBlock = ({ audioID, index = 0, deleteAudioBlock = (id) => { } }) => {
  const colorSet = colorSets[index % 10];

  const audio = audioInfoDict[audioID] ?? {
    id: 'notfound',
    path: '/fillers/period.wav',
    text: 'Audio Not Found'
  };

  return (
    <div
      onClick={() => deleteAudioBlock(index)}
      style={{
        background: colorSet[1],
        border: `1px solid ${colorSet[0]}`,
        padding: '0px 2px'
      }}
    >
      <p>{audio.text}</p>
    </div>
  );

};

export default AudioBlock;
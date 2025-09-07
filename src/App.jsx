import Fuse from 'fuse.js';
import { useState, useMemo, useEffect } from 'react';
import AudioBlock from './components/audioBlock';
import audioInfoDict from './audioMeta/audioInfoDict.json';

const audioInfoList = Object.values(audioInfoDict).map((item, i) => {
  return {
    ...item,
    index: i,
  }
});

const debounce = (func, timeout = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
};

// lots of stuff borrowed from https://thirtydollar.website/🗿.js?v=1a
let audioContext = new AudioContext();

let audioFileData = {};
const fetchAudio = async (audioIDs) => {
  for (let i = 0; i < audioIDs.length; i++) {
    const audioID = audioIDs[i];

    if (audioFileData[audioID]) continue; //already fetched

    let decodedAudio = await fetch(audioInfoDict[audioID].path).then(res => res.arrayBuffer()).then(buffer => audioContext.decodeAudioData(buffer))
    audioFileData[audioID] = decodedAudio;
  };
};

let currentlySavingAudio = false;
const saveAudio = async (audioIDs) => {
  if (currentlySavingAudio) return; //only one save at once
  if (audioIDs.length == 0) return; //no audio to save
  if (!confirm('This will play the audio AND save it. Continue?')) return; //user denied save
  currentlySavingAudio = true;

  try {
    const chunks = [];
    const dest = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(dest.stream, {mimeType: 'audio/webm;codecs=opus'});

    mediaRecorder.ondataavailable = (evt) => {
      // Push each chunk (blobs) in an array
      chunks.push(evt.data);

      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";

      var url = window.URL.createObjectURL(evt.data);
      a.href = url;
      a.download = 'export.ogg';
      a.click();
      window.URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    await playAudio(audioIDs, dest);
    mediaRecorder.stop();

    currentlySavingAudio = false;
  } catch (e) {
    console.log(e)
    currentlySavingAudio = false;
    audioFileData = {};
    alert('There was an issue with saving the audio. Please try again.');
  }
};

let currentlyPlayingAudio = false;
const playAudio = async (audioIDs, mediaRecorderDest) => {
  if (currentlyPlayingAudio) return; //only one play at once
  currentlyPlayingAudio = true;

  try {
    await fetchAudio(audioIDs);
    for (let i = 0; i < audioIDs.length; i++) {
      const audioID = audioIDs[i];
      const source = audioContext.createBufferSource();
      source.buffer = audioFileData[audioID];
      source.connect(audioContext.destination);
      if (mediaRecorderDest) source.connect(mediaRecorderDest);
      source.start();
      await new Promise(r => setTimeout(r, source.buffer.duration * 1000)); // sleep
    }
  } catch (e) {
    console.log(e)
    currentlyPlayingAudio = false;
    audioFileData = {};
    alert('There was an issue with playing the audio. Please try again.');
  }

  currentlyPlayingAudio = false;
};

const App = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [audioBlocks, setAudioBlocks] = useState(JSON.parse(localStorage.getItem('metraAnnouncementsBuilder') ?? '[]'));
  const fuse = useMemo(() => new Fuse(audioInfoList, {
    includeScore: true,
    shouldSort: true,
    includeMatches: true,
    threshold: 0.6,
    distance: 100,
    keys: [
      "textLower"
    ]
  }), [audioInfoList]);

  // loading from URL
  useEffect(() => {
    const loadParam = new URLSearchParams(window.location.search).get('load');
    if (!loadParam) return;

    setAudioBlocksAndSave(loadParam.split(',').map((id) => audioInfoDict[id]));

  }, [window.location.search])

  // looks for exact matches. might change in the future for custom voice selection. idk.
  const modifiedSearch = (query) => {
    const queryLower = query.toLowerCase();

    const exactMatches = audioInfoList.filter((audioInfo) => audioInfo.textLower == queryLower);

    if (exactMatches.length == 0) return fuse.search(queryLower);

    // formatting exact matches into what fuse would return
    return exactMatches.map((audioInfo) => {
      return {
        item: audioInfo,
        matches: [{
          key: 'textLower',
          value: audioInfo.textLower,
          indices: [[0, audioInfo.textLower.length - 1]],
        }],
        refIndex: audioInfo.index,
        score: 0.0
      }
    });
  };

  const updateAndExecuteSearch = (query) => {
    if (query.length == 0) {
      setQuery('');
      setResults([]);
      return;
    }

    const results = fuse.search(query);
    setQuery(query);
    setResults(results);
  };

  const setAudioBlocksAndSave = (newArray) => {
    localStorage.setItem('metraAnnouncementsBuilder', JSON.stringify(newArray));
    setAudioBlocks(newArray);
  };

  const addAudioBlock = (id) => {
    setAudioBlocksAndSave([...audioBlocks, audioInfoDict[id]]);
    setQuery('');
    setResults([]);
  };

  const deleteAudioBlock = (index) => setAudioBlocksAndSave(audioBlocks.filter((audio, i) => i != index));

  const deleteAllAudioBlocks = () => {
    if (audioBlocks.length == 0) return;
    if (!confirm('This will delete ALL audio blocks and cannot be reversed. Continue?')) return;
    setAudioBlocksAndSave([]);
  };

  return (
    <>
      <div id='topBar'>
        <h1 style={{
          backgroundColor: '#003087'
        }}>MAB</h1>
        {/*<button>Help</button>*/}
        <button onClick={() => alert("Metra Announcement Builder was built by Piero Maddaleni (piemadd.com) and is open source. The source repository can be viewed at https://github.com/piemadd/metra-announcements-builder")}>About</button>
        <button onClick={() => deleteAllAudioBlocks()}>Clear</button>
        <button onClick={() => saveAudio(audioBlocks.map(audio => audio.id))}>Export</button>
        <button onClick={() => playAudio(audioBlocks.map(audio => audio.id))}>Play</button>

      </div>
      <main>
        {audioBlocks.map((audio, i) => <AudioBlock audioID={audio.id} index={i} deleteAudioBlock={deleteAudioBlock} />)}
        <div id='searchHolder'>
          <input
            type="text"
            placeholder='Search for a phrase...'
            value={query}
            id="audioBlockInput"
            name="audioBlockInput"
            onChange={(e) => debounce(updateAndExecuteSearch(e.target.value))}
          />
          {results.length > 0 ? (
            <select
              id='searchResultsHolder'
              size={Math.min(10, results.length)}
              onChange={(e) => addAudioBlock(e.target.value)}
            >{results.slice(0, 10).map((result) => {
              return <option
                value={result.item.id}
                title={result.item.text}
                onClick={(e) => addAudioBlock(e.target.value)}
              >[{result.item.id}] {result.item.text}
              </option>
            })}
            </select>
          ) : null}
        </div>
      </main>
    </>
  )
}

export default App;

const { PythonShell } = require('python-shell');
const path = require('path');
require('dotenv').config();

function callTranscribeAudio(audioBuffer, displayName, avatar) {
    const transcribePath = path.join(__dirname, 'transcribe.py');

    // set up python shell to run the transcription script
    const pyShell = new PythonShell(transcribePath, {
        pythonPath: process.env.PYTHON_PATH,
        mode: 'binary', // send as binary data
        args: [displayName, avatar]
    });

    // send audio data
    pyShell.send(audioBuffer);
    // when finished
    pyShell.end((err, code, signal) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Transcription complete, code:", code);
        }
    });
}

module.exports.callTranscribeAudio = callTranscribeAudio;

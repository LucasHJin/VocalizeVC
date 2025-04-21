const fs = require('fs');
const { PythonShell } = require('python-shell');
const path = require('path');
require('dotenv').config();

function callTranscribeAudio(fileName, displayName, avatar) {
    const transcribePath = path.join(__dirname, 'transcribe.py');
    
    // run python script to transcribe the audio
    const pyShell = new PythonShell(transcribePath, {
        pythonPath: process.env.PYTHON_PATH,
        args: [fileName, displayName, avatar]
    });
    
    // delete the audio file on ending transcription
    pyShell.end((err, code, signal) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Transcription complete, code:", code);
            fs.unlink(fileName, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Error deleting audio file ${fileName}:`, unlinkErr);
                } else {
                    console.log(`Deleted audio file ${fileName}`);
                }
            });
        }
    });
}

module.exports.callTranscribeAudio = callTranscribeAudio;
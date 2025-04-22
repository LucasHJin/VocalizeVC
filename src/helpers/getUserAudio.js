require('dotenv').config();
const { EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media'); // to decode opus foramt
const { spawn } = require('child_process'); // to run ffmpeg (multimedia framework to decode and ecode audio)

const { callTranscribeAudio } = require('./callTranscribeAudio');

// logic:
    // get OPUS from discord -> convert to raw PCM -> filter + reformat to wav with ffmpeg -> combine into buffer -> send to get transcription

function getUserAudio(connection, member) {
    const userId = member.id;
    const displayName = member.user.username;
    const avatar = member.user.displayAvatarURL({ format: 'png', dynamic: false, size: 256 });

    // subscribe to user's audio stream
    const opusStream = connection.receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 50,
        },
    });

    // decoder (opus -> raw pcm)
    const decoder = new prism.opus.Decoder({
        frameSize: 960,
        channels: 1,
        rate: 48000,
    });

    // ffmpeg process to clean audio
    const ffmpeg = spawn('ffmpeg', [
        '-f', 's16le',            // input format: raw PCM 16-bit little-endian
        '-ar', '48000',           // input sample rate: 48000 Hz
        '-ac', '1',               // input audio channels: mono
        '-i', 'pipe:0',           // input comes from standard input (a data stream, not a file)
        '-af', 'highpass=f=120, lowpass=f=6000, dynaudnorm, volume=1.5', // filters: remove very low/high frequencies + normalize audio + higher volume
        '-ar', '16000',           // output sample rate: 16000 Hz (good for voice)
        '-ac', '1',               // output channels: mono
        '-sample_fmt', 's16',     // input format: 16-bit PCM
        '-f', 'wav',              // output format: wav
        'pipe:1'                  // output goes back to the program (stdout)
    ]);

    const audioChunks = []; // hold pieces of processed data

    // audio stream -> decoder -> ffmpeg standard input
    opusStream.pipe(decoder).pipe(ffmpeg.stdin);

    // after getting audio data from ffmpeg -> save in audioChunks
    ffmpeg.stdout.on('data', (chunk) => {
        audioChunks.push(chunk);
    });

    opusStream.on('end', () => {
        console.log(`Audio stream ended for ${displayName}`);
        // close ffmpeg standard input (done sending audio)
        ffmpeg.stdin.end();
    });

    // ffmpeg process finishes 
    ffmpeg.on('close', (code) => {
        if (code === 0) {
            console.log(`Finished processing audio for ${displayName}`);
            // combine audio into one buffer (temporary storage area before being played/processed)
            const audioBuffer = Buffer.concat(audioChunks);
            callTranscribeAudio(audioBuffer, displayName, avatar);
        } else {
            console.error(`ffmpeg exited with code ${code}`);
        }
    });
}

module.exports.getUserAudio = getUserAudio;

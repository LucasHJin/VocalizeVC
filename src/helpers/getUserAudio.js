const { EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media'); // to decode opus foramt
const fs = require('fs');
const { spawn } = require('child_process'); // to run ffmpeg (multimedia framework to decode and ecode audio)

function getUserAudio(connection, member) {
    const userId = member.id;
    const displayName = member.user.username;

    // subscribe to user's audio stream
    const opusStream = connection.receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 1000,
        },
    });

    if (!fs.existsSync('./recordings')) {
        fs.mkdirSync('./recordings');
    }
    const fileName = `./recordings/audio_${userId}_${Date.now()}.wav`;

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
        '-af', 'highpass=f=120, lowpass=f=6000, dynaudnorm', // filters: remove very low/high frequencies + normalize audio
        '-ar', '16000',           // output sample rate: 16000 Hz (good for voice)
        '-ac', '1',               // output channels: mono
        '-sample_fmt', 's16',     // output format: 16-bit PCM
        fileName
    ]);

    // audio stream -> decoder -> ffmpeg standard input
    opusStream.pipe(decoder).pipe(ffmpeg.stdin);

    opusStream.on('end', () => {
        console.log(`Audio stream ended for ${displayName}`);
        // close ffmpeg standard input (done sending audio)
        ffmpeg.stdin.end();
    });

    // ffmpeg process finishes 
    ffmpeg.on('close', (code) => {
        if (code === 0) {
            console.log(`Cleaned and saved audio for ${displayName} as ${fileName}`);
        } else {
            console.error(`ffmpeg exited with code ${code}`);
        }
    });
}

module.exports.getUserAudio = getUserAudio;

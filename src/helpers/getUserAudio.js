const { EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media');
const fs = require('fs');
const wav = require('node-wav');

function getUserAudio(connection, member) {
    const userId = member.id;
    const displayName = member.user.username;

    // subscribe to audio stream to get audio data
    const opusStream = connection.receiver.subscribe(userId, {
        end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 500,
        },
    });

    // decode audio
    const decoder = new prism.opus.Decoder({
        frameSize: 480,
        channels: 1,
        rate: 48000,
    });

    const pcmChunks = [];

    opusStream.pipe(decoder);

    // collect all chunks of data
    decoder.on('data', chunk => {
        pcmChunks.push(chunk);
    });

    // save all chunks 
    decoder.on('end', () => {
        if (pcmChunks.length === 0) {
            console.log(`No audio received from ${displayName}`);
            return;
        }

        const combinedPcm = Buffer.concat(pcmChunks);

        // get it as a .wav file
        const wavBuffer = wav.encode(
            [new Int16Array(combinedPcm.buffer)],
            {
                sampleRate: 48000,
                float: false,
                bitDepth: 16,
                channels: 1,
            }
        );

        if (!fs.existsSync('./recordings')) {
            fs.mkdirSync('./recordings');
        }

        const fileName = `./recordings/audio_${userId}_${Date.now()}.wav`;
        fs.writeFileSync(fileName, wavBuffer);
        console.log(`Saved audio for ${displayName} as ${fileName}`);
    });
}

module.exports.getUserAudio = getUserAudio;
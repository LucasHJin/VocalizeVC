// for when user joins or leaves vc

const people = [];
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
let connection = null;

module.exports = {
    name: 'voiceStateUpdate',
    once: false,
    execute(client, oldState, newState) {
        // people leaving and joining
        if (oldState.channelId !== newState.channelId) {
            if (newState.channel) { // person joins
                if (newState.member.user.bot) {
                    return;
                }

                const displayName = newState.member.user.username;
                console.log(`${displayName} joined the voice channel ${newState.channel.name}`);

                const person = people.find(p => p.name === displayName);
                if (person) {
                    person.joinTime.push(new Date());
                } else {
                    people.push({
                        name: displayName,
                        joinTime: [new Date()],
                        leaveTime: [],
                        speakingTime: 0,
                    });
                }
                console.log(people);
            } else { // person leaves
                if (oldState.member.user.bot) {
                    return;
                }

                const displayName = oldState.member.user.username;
                console.log(`${displayName} left the voice channel ${oldState.channel.name}`);

                const person = people.find(p => p.name === displayName);
                if (person) {
                    person.leaveTime.push(new Date());
                } else {
                    people.push({
                        name: displayName,
                        joinTime: [new Date()],
                        leaveTime: [new Date()],
                        speakingTime: 0,
                    });
                }
                console.log(people);
                if (oldState.channel.members.size === 0) {
                    console.log("Call ended");
                    people.length = 0;
                }
            }
        }

        // bot joining (speaking time)
        if (newState.channel && !oldState.channel) {
            if (newState.member.user.bot) {
                return;
            }

            // create connection only if the bot hasn't already joined
            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: newState.channel.id,
                    guildId: newState.guild.id,
                    adapterCreator: newState.guild.voiceAdapterCreator,
                });

                // listen for speaking
                connection.receiver.speaking.on('start', userId => {
                    const user = newState.guild.members.cache.get(userId);
                    const displayName = user.user.username;

                    const person = people.find(p => p.name === displayName);
                    if (person) {
                        person.speakingStartTime = Date.now();
                    }

                    console.log(`${user.user.username} started speaking`);
                });

                connection.receiver.speaking.on('end', userId => {
                    const user = newState.guild.members.cache.get(userId);
                    const displayName = user.user.username;

                    const person = people.find(p => p.name === displayName);
                    if (person && person.speakingStartTime) {
                        const speakingDuration = Date.now() - person.speakingStartTime;
                        person.speakingTime += speakingDuration / 1000;
                        delete person.speakingStartTime; // use instead of global variables because of multiple people in call
                    }

                    console.log(`${user.user.username} stopped speaking`);
                });
            }
        }

        // bot leaves channel
        if (oldState.channel && !newState.channel) {
            if (connection) {
                connection.destroy(); // clean connection
                connection = null;
            }
        }
    }
}
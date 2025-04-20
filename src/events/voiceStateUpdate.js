const { joinVoiceChannel } = require('@discordjs/voice');
const { getUserAudio } = require("../helpers/getUserAudio");

const fs = require('fs');
const path = require('path');

const people = [];
let connection = null;

module.exports = {
    name: 'voiceStateUpdate',
    once: false,
    execute(client, oldState, newState) {
        const user = newState.member?.user || oldState.member?.user;
        if (!user || user.bot) {
            return;
        }

        if (!oldState.channelId && newState.channelId) {
            const transcriptionPath = path.join(__dirname, '../transcription.txt');
            console.log(transcriptionPath)

            fs.writeFile(transcriptionPath, '', (err) => {
                if (err) {
                    console.error("Error clearing transcription file:", err);
                } else {
                    console.log("Transcription file cleared.");
                }
            });
        }

        // user joining a channel
        if (oldState.channelId !== newState.channelId && newState.channel) {
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

            // join voice only if not already connected
            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: newState.channel.id,
                    guildId: newState.guild.id,
                    adapterCreator: newState.guild.voiceAdapterCreator,
                });

                // send message for captions link
                const channel = newState.guild.channels.cache.get(process.env.CHANNEL_ID);
                if (channel) {
                    channel.send(`Captions starting! Join at http://localhost:3005.`);
                }

                // speaking started
                connection.receiver.speaking.on('start', userId => {
                    const member = newState.guild.members.cache.get(userId);
                    if (!member || member.user.bot) {
                        return;
                    }
                    const displayName = member.user.username;

                    const person = people.find(p => p.name === displayName);
                    if (person) {
                        person.speakingStartTime = Date.now();
                    }

                    console.log(`${displayName} started speaking`);

                    // start recording to get audio
                    getUserAudio(connection, member);
                });

                // speaking ended
                connection.receiver.speaking.on('end', userId => {
                    const member = newState.guild.members.cache.get(userId);
                    if (!member || member.user.bot) {
                        return;
                    }
                    const displayName = member.user.username;

                    const person = people.find(p => p.name === displayName);
                    if (person && person.speakingStartTime) {
                        const speakingDuration = Date.now() - person.speakingStartTime;
                        person.speakingTime += speakingDuration / 1000;
                        delete person.speakingStartTime;
                    }

                    console.log(`${displayName} stopped speaking`);
                });
            }
        }

        // user leaving a channel (different channel id and was in old channel before)
        if (oldState.channelId !== newState.channelId && oldState.channel) {
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

            // if channel is now empty (small delay to make sure it works)
            setTimeout(() => {
                if (oldState.channel.members.size === 0) {
                    console.log("Call ended");
                    people.length = 0;

                    const transcriptionPath = path.join(__dirname, '../transcription.txt');
                    console.log(transcriptionPath)

                    fs.writeFile(transcriptionPath, '', (err) => {
                        if (err) {
                            console.error("Error clearing transcription file:", err);
                        } else {
                            console.log("Transcription file cleared.");
                        }
                    });
                }
            }, 500);
        }

        // bot leaves the channel
        if (oldState.channel && !newState.channel && connection) {
            connection.destroy();
            connection = null;
        }
    }
};

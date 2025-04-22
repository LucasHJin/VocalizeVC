const { joinVoiceChannel } = require("@discordjs/voice");
const { getUserAudio } = require("../helpers/getUserAudio");
const { getSummary } = require("../helpers/summarize");
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    ComponentType,
} = require("discord.js");

// still need to do activity summary

const fs = require("fs");
const path = require("path");

const people = [];
let connection = null;
let generateSummary = false;
let originalSummaryQuestion = null;

module.exports = {
    name: "voiceStateUpdate",
    once: false,
    execute(client, oldState, newState) {
        const user = newState.member?.user || oldState.member?.user;
        if (!user || user.bot) {
            return;
        }

        if (!oldState.channelId && newState.channelId) {
            const transcriptionPath = path.join(__dirname, "../transcription.txt");
            console.log(transcriptionPath);

            fs.writeFile(transcriptionPath, "", (err) => {
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
            console.log(
                `${displayName} joined the voice channel ${newState.channel.name}`
            );

            const person = people.find((p) => p.name === displayName);
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
                const channel = newState.guild.channels.cache.get(
                    process.env.CHANNEL_ID
                );
                if (channel) {
                    channel.send(`Captions starting! Join at http://localhost:3005.`);

                    // yes/no button
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("yes_summary")
                            .setLabel("Yes")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId("no_summary")
                            .setLabel("No")
                            .setStyle(ButtonStyle.Danger)
                    );

                    channel
                        .send({
                            content:
                                "Would you like to generate a meeting summary for this call?",
                            components: [row],
                        })
                        .then((sentMessage) => {
                            originalSummaryQuestion = sentMessage;

                            const filter = (interaction) => {
                                return interaction.member.permissions.has("Administrator"); // need admin perms
                            };

                            const collector = sentMessage.createMessageComponentCollector({
                                filter,
                                componentType: ComponentType.Button,
                                time: 86400,
                            });

                            collector.on("collect", (interaction) => {
                                let updatedRow;

                                if (interaction.customId === "yes_summary") {
                                    generateSummary = true;
                                    interaction.reply({
                                        content: "Summary generation enabled for this meeting.",
                                        ephemeral: true,
                                    });

                                    updatedRow = new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("yes_summary")
                                            .setLabel("Yes (Selected)")
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId("no_summary")
                                            .setLabel("No")
                                            .setStyle(ButtonStyle.Danger)
                                            .setDisabled(true)
                                    );
                                } else if (interaction.customId === "no_summary") {
                                    generateSummary = false;
                                    interaction.reply({
                                        content: "Summary generation disabled for this meeting.",
                                        ephemeral: true,
                                    });

                                    updatedRow = new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("yes_summary")
                                            .setLabel("Yes")
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId("no_summary")
                                            .setLabel("No (Selected)")
                                            .setStyle(ButtonStyle.Danger)
                                            .setDisabled(true)
                                    );
                                }

                                sentMessage.edit({
                                    content: "Would you like to generate a meeting summary for this call? (Selection made)",
                                    components: [updatedRow],
                                });

                                collector.stop();
                            });

                            collector.on("end", (collected) => {
                                // if no choice chosen -> default to no summary
                                if (collected.size === 0) {
                                    generateSummary = false;
                                    let updatedRow = new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("yes_summary")
                                            .setLabel("Yes")
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId("no_summary")
                                            .setLabel("No")
                                            .setStyle(ButtonStyle.Danger)
                                            .setDisabled(true)
                                    );

                                    sentMessage.edit({
                                        content: "Would you like to generate a meeting summary for this call? (No selection)",
                                        components: [updatedRow],
                                    });
                                }
                            });
                        })
                        .catch(console.error);
                }

                // speaking started
                connection.receiver.speaking.on("start", (userId) => {
                    const member = newState.guild.members.cache.get(userId);
                    if (!member || member.user.bot) {
                        return;
                    }
                    const displayName = member.user.username;

                    const person = people.find((p) => p.name === displayName);
                    if (person) {
                        person.speakingStartTime = Date.now();
                    }

                    console.log(`${displayName} started speaking`);

                    // start recording to get audio
                    getUserAudio(connection, member);
                });

                // speaking ended
                connection.receiver.speaking.on("end", (userId) => {
                    const member = newState.guild.members.cache.get(userId);
                    if (!member || member.user.bot) {
                        return;
                    }
                    const displayName = member.user.username;

                    const person = people.find((p) => p.name === displayName);
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
            console.log(
                `${displayName} left the voice channel ${oldState.channel.name}`
            );

            const person = people.find((p) => p.name === displayName);
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
                // if empty
                if (oldState.channel.members.size === 0) {
                    console.log("Call ended");
                    people.length = 0;

                    const transcriptionPath = path.join(
                        __dirname,
                        "../transcription.txt"
                    );
                    console.log(transcriptionPath);

                    const channel = newState.guild.channels.cache.get(
                        process.env.CHANNEL_ID
                    );

                    if (channel) {
                        // send transcription txt file
                        channel
                            .send({
                                content: "Transcription for the call: ",
                                files: [transcriptionPath],
                            })
                            .then(() => {
                                console.log("Transcription sent!");
                                // if responded yes to generate summary
                                if (generateSummary) {
                                    console.log("Generating summary...");
                                    getSummary(transcriptionPath)
                                        .then((summary) => {
                                            return channel.send(`**Meeting summary:**\n${summary}`);
                                        })
                                        .then(() => {
                                            fs.writeFile(transcriptionPath, "", (err) => {
                                                if (err)
                                                    console.error(
                                                        "Error clearing transcription file:",
                                                        err
                                                    );
                                                else console.log("Transcription file cleared.");
                                            });
                                        })
                                        .catch(console.error);
                                } else {
                                    // if no to generate summary
                                    console.log("Summary generation skipped.");
                                    fs.writeFile(transcriptionPath, "", (err) => {
                                        if (err)
                                            console.error("Error clearing transcription file:", err);
                                        else console.log("Transcription file cleared.");
                                    });

                                    let updatedRow = new ActionRowBuilder().addComponents(
                                        new ButtonBuilder()
                                            .setCustomId("yes_summary")
                                            .setLabel("Yes")
                                            .setStyle(ButtonStyle.Success)
                                            .setDisabled(true),
                                        new ButtonBuilder()
                                            .setCustomId("no_summary")
                                            .setLabel("No")
                                            .setStyle(ButtonStyle.Danger)
                                            .setDisabled(true)
                                    );

                                    originalSummaryQuestion.edit({
                                        content: "Would you like to generate a meeting summary for this call? (No selection made)",
                                        components: [updatedRow],
                                    });
                                }
                                generateSummary = false;
                            });
                    }
                }
            }, 500);
        }

        // bot leaves the channel
        if (oldState.channel && !newState.channel && connection) {
            connection.destroy();
            connection = null;
        }
    },
};

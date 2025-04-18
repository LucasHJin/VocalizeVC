require('dotenv').config();
const fs = require('fs');
const path = require('path');
const client = require('./client');

// load event files to run on something happening (i.e. startup)
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) { // once
        client.once(event.name, (...args) => event.execute(client, ...args));
    } else { // multiple times
        client.on(event.name, (...args) => event.execute(client, ...args));
    }
}

// load command files that can be called
client.commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    client.commands.set(command.name, command);
}

// message event handler (to run commands)
client.on('messageCreate', message => {
    // ignore bot messages and noncommands
    if (!message.content.startsWith('!') || message.author.bot) {
        return;
    }

    // command name + arguments
    const args = message.content.slice(1).split(/ +/);
    const commandName = args.shift().toLowerCase();

    // try running command
    if (client.commands.has(commandName)) {
        try {
            client.commands.get(commandName).execute(client, message, args);
        } catch (error) {
            console.error(error);
            message.reply('There was an error trying to execute that command!');
        }
    }
});


client.login(process.env.DISCORD_AUTH_TOKEN);

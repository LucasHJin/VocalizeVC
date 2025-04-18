// ensures bot has successfully logged in and is ready to operate
require('dotenv').config();

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        const channel = client.channels.cache.get(process.env.CHANNEL_ID);

        if (channel) {
            channel.send('Bot is now online!');
        } else {
            console.log('Channel not found');
        }
    },
};
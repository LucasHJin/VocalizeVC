module.exports = {
    name: 'ping',
    description: 'Ping the bot to check its latency.',
    execute(client, message, args) {
        const ping = client.ws.ping;
        message.channel.send(`Latency: ${ping}ms`);
    },
};
// for when user joins or leaves vc

module.exports = {
    name: 'voiceStateUpdate',
    once: false,
    execute(client, oldState, newState) {
        if (oldState.channelId !== newState.channelId) {
            if (newState.channel) {
                const displayName = newState.member.nickname || newState.member.user.username;
                console.log(`${displayName} joined the voice channel ${newState.channel.name}`);
            } else {
                const displayName = oldState.member.nickname || oldState.member.user.username;
                console.log(`${displayName} left the voice channel ${oldState.channel.name}`);
            }
        }
    }   
}
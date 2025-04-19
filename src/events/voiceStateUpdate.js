// for when user joins or leaves vc

const people = [];

module.exports = {
    name: 'voiceStateUpdate',
    once: false,
    execute(client, oldState, newState) {
        if (oldState.channelId !== newState.channelId) {
            if (newState.channel) { // person joins
                const displayName = newState.member.user.username;
                console.log(`${displayName} joined the voice channel ${newState.channel.name}`);

                const person = people.find(person => person.name === displayName);
                if (person) {
                    person.joinTime.push(new Date());
                } else {
                    people.push({
                        name: displayName,
                        joinTime: [new Date()],
                        leaveTime: [],
                    });
                }
                console.log(people);
            } else { // person leaves
                const displayName = oldState.member.user.username;
                console.log(`${displayName} left the voice channel ${oldState.channel.name}`);

                const person = people.find(person => person.name === displayName);
                if (person) {
                    person.leaveTime.push(new Date());
                } else {
                    people.push({
                        name: displayName,
                        joinTime: [new Date()],
                        leaveTime: [new Date()],
                    });
                }
                console.log(people);
                if (oldState.channel.members.size === 0) {
                    console.log("Call ended");
                    people.length = 0;
                }
            }
        }
    }   
}
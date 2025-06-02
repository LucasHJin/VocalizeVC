# VocalizeVC
VocalizeVC is a powerful Discord bot designed to improve meeting experiences in voice channels. It's perfect for community teams, clubs, or anyone who hosts discussions via Discord but finds it lacking one critical feature: **live captions**.

In addition to real-time voice transcription, VocalizeVC generates meeting summaries and tracks participation to help ensure that everyone stays informed and engaged.

## Functionalities
1. **Live Discord Voice Captions**
Real-time transcription displayed on a unique URL when a voice call begins.
2. **Meeting Topic Summaries**
Automatically generates concise summaries so absentees can stay in the loop.
3. **Meeting Activity Reports**
Tracks individual activity like when each person joined, left and how much they spoke.

## Getting started (Running it locally)
1. **Clone the repository**
```
git clone https://github.com/yourusername/VocalizeVC.git
cd VocalizeVC
```
2. **Install Python dependencies**
```
pip install -r requirements.txt
```
3. **Create a `.env` file in the root directory with the following environment variables**
```
# For discord bot
DISCORD_AUTH_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
CHANNEL_ID=your_channel_id_here

# For transcription subprocesses
PYTHON_PATH=/full/path/to/python

# For generating summaries
OPENAI_KEY=your_openai_key_here
```
4. **Run `npm start` in the terminal**
5. **(Optional) Host the bot**
Deploy on a cloud platform like Heroku or run it locally on a raspberry pi
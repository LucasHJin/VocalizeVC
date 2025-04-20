import sys
import whisper
import socketio # library to connect to server and send real time updates

sio = socketio.Client()

# connect to front end server
sio.connect('http://localhost:3005')

# load whisper model
model = whisper.load_model("base")

def transcribe(audioFile, speaker):
    result = model.transcribe(audioFile)
    transcription_text = f"{speaker}: {result['text']}\n"
    
    # send custom event to front end
    sio.emit('caption', transcription_text)
    
    with open("./src/transcription.txt", "a") as f:
        f.write(transcription_text)

if __name__ == "__main__":
    # get file + speaker from command line args
    audioFile = sys.argv[1]
    speaker = sys.argv[2]
    transcribe(audioFile, speaker)
    sio.disconnect()
    sys.exit(0)
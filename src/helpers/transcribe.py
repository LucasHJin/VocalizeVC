import sys
import whisper

# load whisper model
model = whisper.load_model("base")

def transcribe(audioFile, speaker):
    result = model.transcribe(audioFile)
    with open("./src/transcription.txt", "a") as f:
        f.write(f"{speaker}: {result["text"]}\n")

if __name__ == "__main__":
    # get file + speaker from command line args
    audioFile = sys.argv[1]
    speaker = sys.argv[2]
    transcribe(audioFile, speaker)
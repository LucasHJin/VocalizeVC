import sys
import socketio
import io
import soundfile as sf
import librosa
from faster_whisper import WhisperModel # faster_whisper instead of whisper

# connect to front end server
sio = socketio.Client()
sio.connect('http://localhost:3005')

# load english only whisper model
model = WhisperModel("small.en", device="cpu", compute_type="int8")

def transcribe(audio_data, speaker, avatar):
    # simulate audio file from raw audio byte data (pretend you have a wav file because whisper needs to be given file input/numpy array)
    audio_file = io.BytesIO(audio_data)
    # turn into numpy array + get sample rate
    audio_np, samplerate = sf.read(audio_file, dtype='float32')

    # resample to 16kHz if needed (what whisper expects)
    if samplerate != 16000:
        audio_np = librosa.resample(audio_np, orig_sr=samplerate, target_sr=16000).astype('float32')

    # get full transcription
    segments, info = model.transcribe(audio_np, language="en")
    full_text = " ".join(segment.text for segment in segments)

    transcription_text = f"{speaker}: {full_text}\n"

    # send custom event to front end
    sio.emit('caption', {
        'speaker': speaker,
        'avatar': avatar,
        'text': full_text
    })

    with open("./src/transcription.txt", "a") as f:
        f.write(transcription_text)

if __name__ == "__main__":
    speaker = sys.argv[1]
    avatar = sys.argv[2]
    audio_data = sys.stdin.buffer.read()
    
    transcribe(audio_data, speaker, avatar)

    sio.disconnect()
    sys.exit(0)

import io
import numpy as np
import librosa
import soundfile as sf
from scipy.signal import butter, lfilter


TARGET_SAMPLE_RATE = 16000
N_MELS = 128
N_FFT = 2048
HOP_LENGTH = 512
TARGET_DURATION = 3.0
TARGET_TIME_STEPS = 128
HIGH_PASS_CUTOFF = 80


def butter_highpass(cutoff, fs, order=5):
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='high', analog=False)
    return b, a


def apply_highpass_filter(audio, sr, cutoff=HIGH_PASS_CUTOFF, order=5):
    b, a = butter_highpass(cutoff, sr, order=order)
    return lfilter(b, a, audio)


def load_audio_from_bytes(audio_bytes):
    audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes))

    if len(audio_data.shape) > 1:
        audio_data = np.mean(audio_data, axis=1)

    if sample_rate != TARGET_SAMPLE_RATE:
        audio_data = librosa.resample(audio_data, orig_sr=sample_rate, target_sr=TARGET_SAMPLE_RATE)

    return audio_data, TARGET_SAMPLE_RATE


def preprocess_audio(audio_data, sr):
    audio_data = apply_highpass_filter(audio_data, sr)

    rms = np.sqrt(np.mean(audio_data ** 2))
    if rms > 0:
        audio_data = audio_data / rms * 0.1

    target_length = int(TARGET_DURATION * sr)
    current_length = len(audio_data)

    if current_length < target_length:
        padding = target_length - current_length
        audio_data = np.pad(audio_data, (0, padding), mode='constant')
    elif current_length > target_length:
        audio_data = audio_data[:target_length]

    return audio_data


def extract_mel_spectrogram(audio_data, sr):
    mel_spectrogram = librosa.feature.melspectrogram(
        y=audio_data,
        sr=sr,
        n_mels=N_MELS,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        fmin=HIGH_PASS_CUTOFF,
        fmax=sr / 2
    )

    log_mel = librosa.power_to_db(mel_spectrogram, ref=np.max)

    log_mel = log_mel[:, :TARGET_TIME_STEPS]
    if log_mel.shape[1] < TARGET_TIME_STEPS:
        padding = TARGET_TIME_STEPS - log_mel.shape[1]
        log_mel = np.pad(log_mel, ((0, 0), (0, padding)), mode='constant')

    mean = np.mean(log_mel)
    std = np.std(log_mel)
    if std > 0:
        log_mel = (log_mel - mean) / std
    else:
        log_mel = log_mel - mean

    return log_mel


def process_audio_bytes(audio_bytes):
    audio_data, sr = load_audio_from_bytes(audio_bytes)
    audio_data = preprocess_audio(audio_data, sr)
    mel_spectrogram = extract_mel_spectrogram(audio_data, sr)
    return mel_spectrogram

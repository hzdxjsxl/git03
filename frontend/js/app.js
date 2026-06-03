const API_BASE_URL = 'http://localhost:8000';
const TARGET_SAMPLE_RATE = 16000;
const HIGH_PASS_CUTOFF = 80;
const MAX_RECORD_SECONDS = 10;

const state = {
    isRecording: false,
    mediaRecorder: null,
    audioContext: null,
    analyser: null,
    sourceNode: null,
    highpassFilter: null,
    recordedChunks: [],
    startTime: 0,
    timerInterval: null,
    animationFrameId: null,
    recordedAudioBuffer: null,
    processedAudioBlob: null,
    lastProbabilities: [0, 0, 0]
};

const elements = {
    recordBtn: document.getElementById('recordBtn'),
    playbackBtn: document.getElementById('playbackBtn'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    timerDisplay: document.getElementById('timerDisplay'),
    statusBadge: document.getElementById('statusBadge'),
    statusText: document.querySelector('.status-text'),
    hintText: document.getElementById('hintText'),
    waveformCanvas: document.getElementById('waveformCanvas'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    dominantEmotion: document.getElementById('dominantEmotion'),
    emotionCards: document.querySelectorAll('.emotion-card'),
    analyzeTime: document.getElementById('analyzeTime'),
    emojiDisplay: document.querySelector('.emoji-display'),
    emotionName: document.querySelector('.emotion-name'),
    confidenceValue: document.querySelector('.confidence-value')
};

const emotionConfig = {
    0: { name: '愤怒', emoji: '😠', class: 'angry' },
    1: { name: '开心', emoji: '😊', class: 'happy' },
    2: { name: '悲伤', emoji: '😢', class: 'sad' }
};

function init() {
    setupCanvas();
    bindEvents();
    checkBackendStatus();
}

function setupCanvas() {
    const canvas = elements.waveformCanvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    drawIdleWaveform();
}

function drawIdleWaveform() {
    const canvas = elements.waveformCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.clearRect(0, 0, width, height);

    const centerY = height / 2;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 2;

    for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.03) * 8;
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}

function bindEvents() {
    elements.recordBtn.addEventListener('click', toggleRecording);
    elements.playbackBtn.addEventListener('click', playRecording);
    elements.analyzeBtn.addEventListener('click', analyzeEmotion);

    window.addEventListener('resize', () => {
        setupCanvas();
        if (!state.isRecording && state.recordedAudioBuffer) {
            drawStaticWaveform(state.recordedAudioBuffer);
        } else if (!state.isRecording) {
            drawIdleWaveform();
        }
    });
}

async function checkBackendStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        if (data.status === 'ok' && data.model_loaded) {
            updateStatus('后端已连接', 'ready');
        }
    } catch (error) {
        updateStatus('后端未连接', 'warning');
        elements.hintText.textContent = '请先启动后端服务，详见 README 说明';
    }
}

function updateStatus(text, type = 'ready') {
    elements.statusText.textContent = text;
    elements.statusBadge.className = 'status-badge';
    if (type === 'recording') {
        elements.statusBadge.classList.add('recording');
    } else if (type === 'processing') {
        elements.statusBadge.classList.add('processing');
    }
}

async function toggleRecording() {
    if (state.isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

async function startRecording() {
    try {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: { ideal: 48000 },
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });

        state.highpassFilter = state.audioContext.createBiquadFilter();
        state.highpassFilter.type = 'highpass';
        state.highpassFilter.frequency.value = HIGH_PASS_CUTOFF;

        state.analyser = state.audioContext.createAnalyser();
        state.analyser.fftSize = 2048;

        state.sourceNode = state.audioContext.createMediaStreamSource(stream);
        state.sourceNode.connect(state.highpassFilter);
        state.highpassFilter.connect(state.analyser);

        state.mediaRecorder = new MediaRecorder(stream, {
            mimeType: MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : 'audio/webm'
        });

        state.recordedChunks = [];
        state.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                state.recordedChunks.push(e.data);
            }
        };

        state.mediaRecorder.onstop = handleRecordingStop;

        state.mediaRecorder.start();
        state.isRecording = true;
        state.startTime = Date.now();

        elements.recordBtn.classList.add('recording');
        updateStatus('正在录音...', 'recording');
        elements.hintText.textContent = '再次点击按钮停止录音';

        startTimer();
        drawLiveWaveform();

        setTimeout(() => {
            if (state.isRecording) {
                stopRecording();
            }
        }, MAX_RECORD_SECONDS * 1000);

    } catch (error) {
        console.error('Error starting recording:', error);
        elements.hintText.textContent = '无法访问麦克风，请检查权限设置';
        updateStatus('麦克风权限被拒绝', 'warning');
    }
}

function stopRecording() {
    if (!state.isRecording) return;

    state.isRecording = false;
    state.mediaRecorder.stop();

    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }

    state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    state.sourceNode.disconnect();
    state.highpassFilter.disconnect();
    state.analyser.disconnect();

    elements.recordBtn.classList.remove('recording');
    updateStatus('录音完成', 'ready');
    elements.hintText.textContent = '点击"分析情绪"按钮开始识别，或点击"回放"试听';
}

async function handleRecordingStop() {
    const recordedBlob = new Blob(state.recordedChunks, { type: state.mediaRecorder.mimeType });

    try {
        const arrayBuffer = await recordedBlob.arrayBuffer();
        const audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer);

        const processedBuffer = await resampleAndDenoise(audioBuffer);
        state.recordedAudioBuffer = processedBuffer;

        state.processedAudioBlob = audioBufferToWav(processedBuffer, TARGET_SAMPLE_RATE);

        drawStaticWaveform(processedBuffer);

        elements.playbackBtn.disabled = false;
        elements.analyzeBtn.disabled = false;

    } catch (error) {
        console.error('Error processing recording:', error);
        elements.hintText.textContent = '音频处理失败，请重新录制';
    } finally {
        if (state.audioContext) {
            state.audioContext.close();
            state.audioContext = null;
        }
    }
}

async function resampleAndDenoise(audioBuffer) {
    const offlineCtx = new OfflineAudioContext(1, audioBuffer.length * TARGET_SAMPLE_RATE / audioBuffer.sampleRate, TARGET_SAMPLE_RATE);

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    const highpass = offlineCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = HIGH_PASS_CUTOFF;
    highpass.Q.value = 0.7;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = 0.95;

    source.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    source.start();

    const renderedBuffer = await offlineCtx.startRendering();

    const channelData = renderedBuffer.getChannelData(0);
    const rms = Math.sqrt(channelData.reduce((sum, val) => sum + val * val, 0) / channelData.length);
    if (rms > 0) {
        const targetRms = 0.15;
        const scale = targetRms / rms;
        for (let i = 0; i < channelData.length; i++) {
            channelData[i] = Math.max(-1, Math.min(1, channelData[i] * scale));
        }
    }

    const noiseFloor = 0.02;
    for (let i = 0; i < channelData.length; i++) {
        if (Math.abs(channelData[i]) < noiseFloor) {
            channelData[i] = 0;
        }
    }

    return renderedBuffer;
}

function audioBufferToWav(audioBuffer, sampleRate) {
    const numChannels = audioBuffer.numberOfChannels;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const channelData = [];
    let totalLength = 0;
    for (let i = 0; i < numChannels; i++) {
        const data = audioBuffer.getChannelData(i);
        channelData.push(data);
        totalLength += data.length;
    }

    const dataLength = totalLength * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < channelData[0].length; i++) {
        for (let ch = 0; ch < numChannels; ch++) {
            const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, intSample, true);
            offset += 2;
        }
    }

    return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function startTimer() {
    elements.timerDisplay.textContent = '00:00';
    state.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        elements.timerDisplay.textContent = `${minutes}:${seconds}`;
    }, 100);
}

function drawLiveWaveform() {
    const canvas = elements.waveformCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        if (!state.isRecording) return;

        state.animationFrameId = requestAnimationFrame(draw);

        state.analyser.getByteTimeDomainData(dataArray);

        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(255, 71, 87, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 107, 53, 0.6)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.4)');

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.shadowColor = 'rgba(255, 71, 87, 0.5)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    draw();
}

function drawStaticWaveform(audioBuffer) {
    const canvas = elements.waveformCanvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.clearRect(0, 0, width, height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const centerY = height / 2;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
    gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.7)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.5)');

    ctx.fillStyle = gradient;

    for (let x = 0; x < width; x++) {
        let min = 1.0;
        let max = -1.0;

        for (let j = 0; j < step; j++) {
            const datum = data[(x * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }

        const y1 = (1 + min) * centerY;
        const y2 = (1 + max) * centerY;
        const barHeight = Math.max(1, y2 - y1);

        ctx.fillRect(x, y1, 1, barHeight);
    }

    ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
    ctx.shadowBlur = 8;
    ctx.fillRect(0, centerY - 1, width, 2);
    ctx.shadowBlur = 0;
}

async function playRecording() {
    if (!state.processedAudioBlob) return;

    const audioUrl = URL.createObjectURL(state.processedAudioBlob);
    const audio = new Audio(audioUrl);
    audio.play();

    audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
    };
}

async function analyzeEmotion() {
    if (!state.processedAudioBlob) return;

    try {
        showLoading(true);
        updateStatus('分析中...', 'processing');

        const formData = new FormData();
        formData.append('file', state.processedAudioBlob, 'recording.wav');

        const startTime = Date.now();
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const totalTime = Date.now() - startTime;

        if (result.success) {
            state.lastProbabilities = result.probabilities;
            renderEmotionResults(result.probabilities, totalTime, result.inference_time_ms);
            updateStatus('分析完成', 'ready');
        } else {
            throw new Error('Analysis failed');
        }

    } catch (error) {
        console.error('Error analyzing emotion:', error);
        elements.hintText.textContent = '分析失败，请检查后端服务是否正常运行';
        updateStatus('分析失败', 'warning');
    } finally {
        showLoading(false);
    }
}

function renderEmotionResults(probabilities, totalTimeMs, inferenceTimeMs) {
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const dominant = emotionConfig[maxIndex];

    elements.dominantEmotion.className = `dominant-emotion active ${dominant.class}`;
    elements.emojiDisplay.textContent = dominant.emoji;
    elements.emotionName.textContent = dominant.name;
    elements.confidenceValue.textContent = `${(probabilities[maxIndex] * 100).toFixed(1)}%`;

    elements.analyzeTime.textContent = `推理 ${inferenceTimeMs}ms · 总耗时 ${totalTimeMs}ms`;

    elements.emotionCards.forEach((card, index) => {
        const prob = probabilities[index];
        const percent = (prob * 100).toFixed(1);

        const progressFill = card.querySelector('.progress-fill');
        const percentText = card.querySelector('.emotion-percent');

        card.classList.remove('active');
        if (index === maxIndex) {
            card.classList.add('active');
        }

        setTimeout(() => {
            progressFill.style.width = `${percent}%`;
            percentText.textContent = `${percent}%`;
        }, index * 100);
    });

    const resultText = probabilities.map((p, i) =>
        `${emotionConfig[i].name}: ${(p * 100).toFixed(1)}%`
    ).join(' · ');
    elements.hintText.textContent = resultText;
}

function showLoading(show) {
    if (show) {
        elements.loadingOverlay.classList.add('active');
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', init);

// ============================================================
// Enhanced Kitchen Audio & Clear Vietnamese Voice Notification Engine
// 1. Web Audio API (Multi-harmonic Bell Chimes)
// 2. High-Quality Native Vietnamese Voice Stream (/api/tts)
// 3. Web Speech Synthesis (Offline Fallback)
// ============================================================

// 1. Order Bell Chime (Warm, resonant kitchen bell)
export function playOrderChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const playBellHarmonic = (freq: number, startTime: number, duration: number, vol = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      // Bell envelope
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Melodic sequence: C5 -> E5 -> G5 -> C6
    playBellHarmonic(523.25, now, 0.8, 0.3);        // C5
    playBellHarmonic(659.25, now + 0.18, 0.9, 0.32);  // E5
    playBellHarmonic(783.99, now + 0.36, 1.2, 0.38);  // G5
    playBellHarmonic(1046.50, now + 0.54, 1.4, 0.32); // C6
  } catch (err) {
    console.warn('[Audio] Could not play order chime:', err);
  }
}

// 2. Staff Call Bell (Urgent counter service bell: Ding-Ding-Ding!)
export function playStaffCallChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const playCounterDing = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, startTime);
      osc.frequency.exponentialRampToValueAtTime(1150, startTime + 0.3);

      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    };

    // Triple Ding!
    playCounterDing(now);
    playCounterDing(now + 0.18);
    playCounterDing(now + 0.36);
  } catch (err) {
    console.warn('[Audio] Could not play staff call chime:', err);
  }
}

// Keep a reference to current active speech audio to prevent overlapping
let currentVoiceAudio: HTMLAudioElement | null = null;

// 3. Clear Vietnamese Voice Player
// Uses high-quality native Vietnamese TTS audio stream with SpeechSynthesis fallback
export function speakVietnamese(text: string): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Stop any currently playing voice audio
    if (currentVoiceAudio) {
      currentVoiceAudio.pause();
      currentVoiceAudio.currentTime = 0;
      currentVoiceAudio = null;
    }

    // Cancel browser synthesis if running
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Primary: Native Vietnamese Audio stream from /api/tts
    const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(ttsUrl);
    audio.volume = 1.0;
    currentVoiceAudio = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('[TTS] Audio playback error, falling back to SpeechSynthesis:', error);
        fallbackSpeechSynthesis(text);
      });
    }
  } catch (err) {
    console.warn('[TTS] Failed to initialize audio TTS:', err);
    fallbackSpeechSynthesis(text);
  }
}

// Offline fallback using Web Speech Synthesis API
function fallbackSpeechSynthesis(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(
      (v) =>
        v.lang === 'vi-VN' ||
        v.lang.toLowerCase().startsWith('vi') ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('việt')
    );

    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('[SpeechSynthesis] Fallback failed:', e);
  }
}

// 4. Combined Action: New Order Alert (Chime + Clear Vietnamese Voice)
export function notifyNewOrder(tableName: string, customerName?: string): void {
  // 1. Play the resonant kitchen order chime
  playOrderChime();

  // 2. Announce clearly in Vietnamese after the bell chime
  setTimeout(() => {
    const speechText = customerName
      ? `${tableName}, khách ${customerName} vừa đặt món!`
      : `${tableName} vừa đặt món mới!`;
    speakVietnamese(speechText);
  }, 600);
}

// 5. Combined Action: Staff Call Alert (Call Chime + Clear Vietnamese Voice)
export function notifyStaffCall(tableName: string, customerName?: string): void {
  // 1. Play counter service bell
  playStaffCallChime();

  // 2. Announce clearly in Vietnamese after the bell chime
  setTimeout(() => {
    const speechText = customerName
      ? `${tableName}, khách ${customerName} đang gọi nhân viên!`
      : `${tableName} đang gọi nhân viên phục vụ!`;
    speakVietnamese(speechText);
  }, 600);
}

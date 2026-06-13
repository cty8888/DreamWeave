import { ref, onBeforeUnmount } from 'vue';

// 浏览器语音合成（TTS）朗读。零后端依赖。
export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const speakingId = ref(null); // 正在朗读的标识，用于按钮状态

  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => /zh/i.test(v.lang)) ||
      voices.find((v) => v.default) ||
      voices[0] ||
      null
    );
  }

  // 朗读指定文本；若同一 id 正在朗读则停止（toggle）
  function toggle(id, text) {
    if (!supported || !text) return;
    if (speakingId.value === id) {
      stop();
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.95;
    u.pitch = 1;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = () => {
      if (speakingId.value === id) speakingId.value = null;
    };
    u.onerror = () => {
      if (speakingId.value === id) speakingId.value = null;
    };
    speakingId.value = id;
    window.speechSynthesis.speak(u);
  }

  function stop() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    speakingId.value = null;
  }

  onBeforeUnmount(stop);

  return { supported, speakingId, toggle, stop };
}

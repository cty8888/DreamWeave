import { ref } from 'vue';

// 数字从 0 缓动滚动到目标值（easeOutCubic）。尊重 prefers-reduced-motion。
export function useCountUp(duration = 1100) {
  const value = ref(0);
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function run(target) {
    const to = Number(target) || 0;
    if (reduce) {
      value.value = to;
      return;
    }
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      value.value = Math.round(to * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  return { value, run };
}

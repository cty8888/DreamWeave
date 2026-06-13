// v-reveal：元素滚动进入视口时添加 .revealed，触发入场动画。
// 用法：<div v-reveal> 或 <div v-reveal="120">（120 = 延迟毫秒）
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer = null;
function getObserver() {
  if (observer || reduceMotion) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  return observer;
}

export default {
  mounted(el, binding) {
    el.classList.add('reveal');
    const delay = Number(binding.value) || 0;
    if (delay) el.style.transitionDelay = `${delay}ms`;

    if (reduceMotion) {
      el.classList.add('revealed');
      return;
    }
    getObserver().observe(el);
  },
  unmounted(el) {
    if (observer) observer.unobserve(el);
  },
};

<template>
  <div class="emotion-selector">
    <label>情感标签</label>
    <div class="tag-grid">
      <div v-for="emotion in allEmotions" :key="emotion.id || emotion.name" class="emotion-row">
        <button :class="{ active: isSelected(emotion) }" type="button" @click="toggle(emotion)">
          {{ emotion.name }}
        </button>
        <input v-if="isSelected(emotion)" type="range" min="1" max="5"
          :value="getIntensity(emotion)" @input="setIntensity(emotion, $event.target.value)" />
        <span v-if="isSelected(emotion)">{{ getIntensity(emotion) }}</span>
      </div>
    </div>
    <div class="custom-tag">
      <input v-model="customName" placeholder="自定义情感，回车添加…" @keyup.enter="addCustom" />
      <button type="button" class="btn-ghost" @click="addCustom">添加</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTagsStore } from '../stores/tags';

const props = defineProps({ modelValue: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue']);

const tagsStore = useTagsStore();
const customName = ref('');
const customEmotions = ref([]);

const allEmotions = computed(() => [...tagsStore.emotions, ...customEmotions.value]);

onMounted(() => tagsStore.fetchTags());

function isSelected(emotion) {
  return props.modelValue.some(e => (e.name || e) === (emotion.name || emotion));
}

function getIntensity(emotion) {
  const found = props.modelValue.find(e => (e.name || e) === (emotion.name || emotion));
  return found?.intensity || 3;
}

function toggle(emotion) {
  const name = emotion.name || emotion;
  const current = [...props.modelValue];
  const idx = current.findIndex(e => (e.name || e) === name);
  if (idx >= 0) current.splice(idx, 1);
  else current.push({ name, intensity: 3 });
  emit('update:modelValue', current);
}

function setIntensity(emotion, value) {
  const name = emotion.name || emotion;
  const current = props.modelValue.map(e =>
    (e.name || e) === name ? { ...e, intensity: Number(value) } : e
  );
  emit('update:modelValue', current);
}

function addCustom() {
  const name = customName.value.trim();
  if (name) {
    customEmotions.value.push({ name, isCustom: true });
  }
  customName.value = '';
}
</script>

<style scoped>
.emotion-selector label {
  margin-bottom: 12px;
}
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.emotion-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 5px;
  border-radius: 999px;
  background: rgba(10, 12, 26, 0.4);
  border: 1px solid transparent;
  transition: border-color 0.25s var(--ease);
}
.emotion-row:has(.active) {
  border-color: rgba(255, 192, 159, 0.3);
}
.emotion-row > button {
  font-size: 0.85rem;
  font-weight: 500;
  padding: 7px 15px;
  border-radius: 999px;
  color: var(--mist);
  background: rgba(60, 68, 120, 0.22);
  border: 1px solid var(--line);
  box-shadow: none;
  transition: all 0.25s var(--ease);
}
.emotion-row > button:hover:not(:disabled) {
  color: var(--dawn);
  border-color: rgba(255, 192, 159, 0.4);
  background: rgba(255, 192, 159, 0.08);
  box-shadow: none;
}
.emotion-row > button.active {
  color: #2a1206;
  background: linear-gradient(120deg, var(--dawn), var(--dawn-deep));
  border-color: transparent;
}
.emotion-row input[type='range'] {
  width: 78px;
}
.emotion-row > span {
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dawn);
  min-width: 12px;
}
.custom-tag {
  display: flex;
  gap: 10px;
}
.custom-tag input {
  flex: 1;
}
.custom-tag button {
  flex-shrink: 0;
  padding: 10px 20px;
}
</style>

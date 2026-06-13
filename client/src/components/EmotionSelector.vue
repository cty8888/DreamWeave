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
      <input v-model="customName" placeholder="自定义情感..." @keyup.enter="addCustom" />
      <button type="button" @click="addCustom">添加</button>
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

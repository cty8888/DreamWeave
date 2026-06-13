<template>
  <div class="scene-selector">
    <label>场景标签</label>
    <div class="tag-grid">
      <button v-for="scene in allScenes" :key="scene.id || scene.name"
        :class="{ active: isSelected(scene) }" type="button" @click="toggle(scene)">
        {{ scene.name }}
      </button>
    </div>
    <div class="custom-tag">
      <input v-model="customName" placeholder="自定义场景，回车添加…" @keyup.enter="addCustom" />
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
const customScenes = ref([]);

const allScenes = computed(() => [...tagsStore.scenes, ...customScenes.value]);

onMounted(() => tagsStore.fetchTags());

function isSelected(scene) {
  return props.modelValue.some(s => (s.name || s) === (scene.name || scene));
}

function toggle(scene) {
  const name = scene.name || scene;
  const current = [...props.modelValue];
  const idx = current.findIndex(s => (s.name || s) === name);
  if (idx >= 0) current.splice(idx, 1);
  else current.push({ name, id: scene.id });
  emit('update:modelValue', current);
}

function addCustom() {
  const name = customName.value.trim();
  if (name && !allScenes.value.find(s => s.name === name)) {
    customScenes.value.push({ name, isCustom: true });
    emit('update:modelValue', [...props.modelValue, { name, isCustom: true }]);
  }
  customName.value = '';
}
</script>

<style scoped>
.scene-selector label {
  margin-bottom: 12px;
}
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-bottom: 16px;
}
.tag-grid > button {
  font-size: 0.85rem;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 999px;
  color: var(--mist);
  background: rgba(60, 68, 120, 0.22);
  border: 1px solid var(--line);
  box-shadow: none;
  transition: all 0.25s var(--ease);
}
.tag-grid > button:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: rgba(94, 234, 212, 0.4);
  color: var(--aurora-teal);
  background: rgba(94, 234, 212, 0.08);
  box-shadow: none;
}
.tag-grid > button.active {
  color: var(--ink-on-light);
  background: linear-gradient(120deg, var(--aurora-teal), var(--aurora-indigo));
  border-color: transparent;
  box-shadow: var(--glow-teal);
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

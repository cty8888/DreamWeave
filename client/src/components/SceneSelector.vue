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
      <input v-model="customName" placeholder="自定义场景..." @keyup.enter="addCustom" />
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

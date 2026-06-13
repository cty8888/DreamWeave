<template>
  <div class="page page--narrow">
    <div class="section-head">
      <p class="eyebrow">{{ isEdit ? '修改这个梦' : '捕捉转瞬即逝的梦' }}</p>
      <h1>{{ isEdit ? '编辑梦境' : '记录梦境' }}</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="dream-form glass">
      <div class="field">
        <label>标题</label>
        <input v-model="title" placeholder="给这个梦起个名字（可选）" />
      </div>

      <div class="field">
        <label>梦里发生了什么</label>
        <textarea
          v-model="content"
          placeholder="我梦见自己站在一片没有尽头的海上……"
          rows="8"
          required
        ></textarea>
      </div>

      <div class="field">
        <SceneSelector v-model="sceneIds" />
      </div>

      <div class="field">
        <EmotionSelector v-model="emotionTags" />
      </div>

      <div class="field">
        <label>这个梦属于谁</label>
        <div class="vis-toggle">
          <label class="vis-opt" :class="{ active: visibility === 'private' }">
            <input type="radio" v-model="visibility" value="private" />
            <span class="vis-icon">🌙</span>
            <span class="vis-name">私有</span>
            <span class="vis-desc">仅自己可见，由 AI 为你续写完整故事</span>
          </label>
          <label class="vis-opt" :class="{ active: visibility === 'public' }">
            <input type="radio" v-model="visibility" value="public" />
            <span class="vis-icon">✦</span>
            <span class="vis-name">公开</span>
            <span class="vis-desc">出现在广场，让陌生人接力续写</span>
          </label>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="form-foot">
        <button type="submit" :disabled="loading || !content.trim()">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? '保存中…' : isEdit ? '保存修改' : '保存梦境' }}
        </button>
        <span v-if="!isEdit && draftSaved" class="draft-hint">✓ 草稿已自动保存</span>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api/client';
import SceneSelector from '../components/SceneSelector.vue';
import EmotionSelector from '../components/EmotionSelector.vue';
import { useTagsStore } from '../stores/tags';

const route = useRoute();
const router = useRouter();
const tagsStore = useTagsStore();

const isEdit = computed(() => route.name === 'dream-edit');
const DRAFT_KEY = 'dreamweave-draft';

const title = ref('');
const content = ref('');
const sceneIds = ref([]);
const emotionTags = ref([]);
const visibility = ref('private');
const loading = ref(false);
const error = ref('');
const draftSaved = ref(false);
let restoring = true;

// 把存储的 scene_ids（可能是预设 id 或自定义名）还原成选择器需要的 {name,id} 形态
function normalizeScenes(raw) {
  let arr = raw;
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr); } catch { arr = []; }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => {
    if (typeof s === 'object' && s.name) return s;
    const tag = tagsStore.scenes.find((t) => t.id === s || t.name === s);
    return tag ? { name: tag.name, id: tag.id } : { name: String(s) };
  });
}

onMounted(async () => {
  await tagsStore.fetchTags();

  if (isEdit.value) {
    try {
      const res = await apiClient.get(`/dreams/${route.params.id}`);
      const d = res.data;
      title.value = d.title || '';
      content.value = d.content || '';
      visibility.value = d.visibility || 'private';
      sceneIds.value = normalizeScenes(d.scene_ids);
      try { emotionTags.value = JSON.parse(d.emotion_tags || '[]'); } catch { emotionTags.value = []; }
    } catch {
      error.value = '加载失败';
    }
  } else {
    // 恢复草稿
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft) {
        title.value = draft.title || '';
        content.value = draft.content || '';
        sceneIds.value = draft.sceneIds || [];
        emotionTags.value = draft.emotionTags || [];
        visibility.value = draft.visibility || 'private';
        draftSaved.value = true;
      }
    } catch { /* ignore */ }
  }
  restoring = false;
});

// 草稿自动保存（仅新建模式）
watch([title, content, sceneIds, emotionTags, visibility], () => {
  if (restoring || isEdit.value) return;
  if (!title.value && !content.value && !sceneIds.value.length && !emotionTags.value.length) return;
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      title: title.value,
      content: content.value,
      sceneIds: sceneIds.value,
      emotionTags: emotionTags.value,
      visibility: visibility.value,
    })
  );
  draftSaved.value = true;
}, { deep: true });

async function handleSubmit() {
  if (!content.value.trim()) return;
  error.value = '';
  loading.value = true;
  const payload = {
    title: title.value,
    content: content.value,
    scene_ids: sceneIds.value.map((s) => s.name || s),
    emotion_tags: emotionTags.value,
    visibility: visibility.value,
  };
  try {
    let id;
    if (isEdit.value) {
      await apiClient.put(`/dreams/${route.params.id}`, payload);
      id = route.params.id;
    } else {
      const res = await apiClient.post('/dreams', payload);
      id = res.data.id;
      localStorage.removeItem(DRAFT_KEY); // 提交成功后清除草稿
    }
    router.push(`/dreams/${id}`);
  } catch (e) {
    error.value = e.response?.data?.error || '保存失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.dream-form {
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding: 34px 32px;
}
.form-foot {
  display: flex;
  align-items: center;
  gap: 16px;
}
.draft-hint {
  font-size: 0.82rem;
  color: var(--aurora-teal);
}

.vis-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.vis-opt {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 18px 18px 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: rgba(10, 12, 26, 0.45);
  cursor: pointer;
  transition: border-color 0.3s var(--ease), background 0.3s var(--ease),
    transform 0.3s var(--ease);
  margin: 0;
}
.vis-opt input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.vis-opt:hover {
  transform: translateY(-2px);
  border-color: var(--line-hi);
}
.vis-opt.active {
  border-color: var(--glow-ring);
  background: rgba(129, 140, 248, 0.12);
  box-shadow: var(--glow-indigo);
}
.vis-icon {
  font-size: 1.4rem;
}
.vis-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--moon);
  font-weight: 600;
}
.vis-desc {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--mist-dim);
}

@media (max-width: 560px) {
  .vis-toggle {
    grid-template-columns: 1fr;
  }
}
</style>

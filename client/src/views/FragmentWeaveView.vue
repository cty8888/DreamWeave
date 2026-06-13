<template>
  <div class="fragment-weave">
    <h1>碎片串联</h1>
    <p>上传多个零散的梦境碎片，AI 将它们编织成完整故事。</p>
    <FragmentEditor v-model="fragments" />
    <button @click="weave" :disabled="loading||fragments.length<2">🤖 开始编织</button>
    <div v-if="story" class="result"><h2>编织结果</h2><p>{{story}}</p></div>
    <p v-if="error" class="error">{{error}}</p>
    <div v-if="sessions.length"><h2>历史记录</h2>
      <div v-for="s in sessions" :key="s.session_id" @click="$router.push(`/fragments/${s.session_id}`)" class="hist-item">
        <span>{{s.created_at?.slice(0,10)}}</span><span>{{s.fragment_count}} 个碎片</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import {ref,onMounted} from 'vue';
import apiClient from '../api/client';
import FragmentEditor from '../components/FragmentEditor.vue';
const fragments=ref([{content:''},{content:''}]), story=ref(''), error=ref(''), loading=ref(false), sessions=ref([]);
onMounted(async()=>{try{const r=await apiClient.get('/fragments/sessions');sessions.value=r.data;}catch{}});
async function weave(){error.value='';loading.value=true;
  try{const r=await apiClient.post('/fragments/weave',{fragments:fragments.value});story.value=r.data.story;}catch(e){error.value=e.response?.data?.error||'编织失败';}
  finally{loading.value=false;}
}
</script>

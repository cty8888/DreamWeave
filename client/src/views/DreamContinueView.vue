<template>
  <div class="continue-page">
    <h1>接力续写</h1>
    <p v-if="dream">续写 @{{ dream.username }} 的梦境「{{ dream.title || '无标题' }}」</p>
    <div class="modes">
      <label><input type="radio" v-model="mode" value="linear" /> 线性接力</label>
      <label><input type="radio" v-model="mode" value="independent" /> 独立续写</label>
    </div>
    <textarea v-model="content" placeholder="写下你的续写..." rows="8" required></textarea>
    <button @click="submit" :disabled="loading">提交续写</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import apiClient from '../api/client';
const route=useRoute(), router=useRouter();
const dream=ref(null), content=ref(''), mode=ref('linear'), loading=ref(false), error=ref('');
onMounted(async()=>{const r=await apiClient.get(`/dreams/${route.params.id}`);dream.value=r.data;});
async function submit(){
  if(!content.value.trim())return;
  loading.value=true; error.value='';
  try{
    const conts=await apiClient.get(`/dreams/${route.params.id}/continuations`);
    const linear=conts.data.filter(c=>!c.is_independent);
    const last=linear[linear.length-1]||null;
    await apiClient.post(`/dreams/${route.params.id}/continuations`,{
      content:content.value, parent_id:mode.value==='linear'?last?.id:null, is_independent:mode.value==='independent'
    });
    router.push(`/dreams/${route.params.id}`);
  }catch(e){error.value=e.response?.data?.error||'提交失败';}
  finally{loading.value=false;}
}
</script>

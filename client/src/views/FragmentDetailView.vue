<template>
  <div><h1>历史碎片</h1><div v-for="f in fragments" :key="f.id"><p>{{f.content}}</p></div></div>
</template>
<script setup>
import {ref,onMounted} from 'vue';import {useRoute} from 'vue-router';import apiClient from '../api/client';
const route=useRoute();const fragments=ref([]);
onMounted(async()=>{const r=await apiClient.get(`/fragments/sessions/${route.params.id}`);fragments.value=r.data;});
</script>

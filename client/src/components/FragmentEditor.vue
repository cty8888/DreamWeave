<template>
  <div class="fragment-editor">
    <div v-for="(f,i) in fragments" :key="i" class="fragment-item">
      <span>{{i+1}}</span>
      <textarea v-model="fragments[i].content" :placeholder="`碎片${i+1}`" rows="3"></textarea>
      <button type="button" @click="remove(i)">✕</button>
    </div>
    <button type="button" @click="addFragment">+ 添加碎片</button>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
const props=defineProps({modelValue:{type:Array,default:()=>[]}});
const emit=defineEmits(['update:modelValue']);
const fragments=ref(props.modelValue.length?[...props.modelValue]:[{content:''},{content:''}]);
watch(fragments,()=>emit('update:modelValue',fragments.value),{deep:true});
function addFragment(){fragments.value.push({content:''});}
function remove(i){fragments.value.splice(i,1);}
</script>

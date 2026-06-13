<template>
  <div class="fragment-editor">
    <div v-for="(f, i) in fragments" :key="i" class="fragment-item">
      <span class="frag-num">{{ i + 1 }}</span>
      <textarea
        v-model="fragments[i].content"
        :placeholder="`第 ${i + 1} 个碎片：一个画面、一句话、一种感觉…`"
        rows="3"
      ></textarea>
      <button type="button" class="frag-del" @click="remove(i)" title="删除">✕</button>
    </div>
    <button type="button" class="btn-ghost frag-add" @click="addFragment">+ 添加碎片</button>
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

<style scoped>
.fragment-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fragment-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.frag-num {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-top: 8px;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: var(--font-display);
  color: var(--aurora-teal);
  background: rgba(94, 234, 212, 0.1);
  border: 1px solid rgba(94, 234, 212, 0.3);
}
.fragment-item textarea {
  flex: 1;
}
.frag-del {
  flex-shrink: 0;
  margin-top: 8px;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
  font-size: 0.8rem;
  color: var(--mist-dim);
  background: transparent;
  border: 1px solid var(--line);
  box-shadow: none;
}
.frag-del:hover:not(:disabled) {
  color: #ff9bb0;
  border-color: rgba(255, 90, 120, 0.4);
  background: rgba(255, 90, 120, 0.08);
  transform: none;
  box-shadow: none;
}
.frag-add {
  align-self: flex-start;
  font-size: 0.88rem;
  padding: 9px 18px;
}
</style>

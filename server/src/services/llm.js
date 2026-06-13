const OpenAI = require('openai');
const config = require('../config');

let client = null;

function getClient() {
  if (!client) {
    if (!config.llm.apiKey) {
      throw new Error('LLM_API_KEY is not configured. Please set the LLM_API_KEY environment variable.');
    }
    client = new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.baseURL,
    });
  }
  return client;
}

async function generateCompletion(systemPrompt, userPrompt, { maxTokens = 2000, timeout = 30000 } = {}) {
  const response = await getClient().chat.completions.create({
    model: config.llm.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.8,
  }, { timeout });

  return response.choices[0].message.content;
}

async function continueDream(dreamContent, sceneTags, emotionTags) {
  const systemPrompt = '你是一位擅长梦境叙事和超现实主义文学的作家。请根据用户的梦境记录，将其续写成一个有开头、发展、高潮和结尾的完整故事。保持梦境的氛围和情感基调。使用中文写作。';
  const userPrompt = `梦境内容：${dreamContent}\n场景：${sceneTags.join('、')}\n情感基调：${JSON.stringify(emotionTags)}\n\n请续写这个梦境，使其成为一个完整的故事：`;
  return generateCompletion(systemPrompt, userPrompt);
}

async function weaveFragments(fragments) {
  const systemPrompt = '你是一位擅长梦境叙事和超现实主义文学的作家。请将以下多个零散的梦境碎片编织成一个连贯的完整故事。在碎片之间建立逻辑联系，让整体流畅自然。使用中文写作。';
  const fragmentsText = fragments.map((f, i) => `碎片${i + 1}：${f}`).join('\n');
  const userPrompt = `${fragmentsText}\n\n请将这些碎片编织成一个完整故事：`;
  return generateCompletion(systemPrompt, userPrompt, { maxTokens: 3000 });
}

module.exports = { continueDream, weaveFragments };

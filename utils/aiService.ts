import { Mistral } from '@mistralai/mistralai';

const MISTRAL_API_KEY = process.env.EXPO_PUBLIC_MISTRAL_API_KEY || '';


const client = new Mistral({
    apiKey: MISTRAL_API_KEY
});

const SYSTEM_PROMPT = `أنت مساعد إسلامي ذكي ومفيد. مهمتك هي الإجابة على الأسئلة المتعلقة بالإسلام بطريقة دقيقة ومحترمة.

قواعد مهمة:
1. استخدم القرآن الكريم والأحاديث الصحيحة كمصادر رئيسية
2. اذكر المصادر عند الإمكان (سورة، رقم الآية، أو مرجع الحديث)
3. كن محترماً ومتواضعاً في إجاباتك
4. إذا لم تكن متأكداً من إجابة، قل ذلك بوضوح
5. ركز على التعليم والإرشاد
6. تجنب الخلافات الفقهية المعقدة
7. شجع المستخدم على طلب العلم والتقرب إلى الله

أجب باللغة العربية إذا كان السؤال بالعربية، وبالإنجليزية إذا كان السؤال بالإنجليزية.`;

export async function sendMessageToAI(messages: { role: 'user' | 'assistant' | 'system', content: string }[]): Promise<string> {
    try {
        if (!MISTRAL_API_KEY) {
            throw new Error('Mistral API key is not configured');
        }

        const chatResponse = await client.chat.complete({
            model: 'devstral-2512',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages
            ],
            temperature: 0.7,
            maxTokens: 1000,
        });

        const content = chatResponse.choices?.[0]?.message?.content;

        if (!content) {
            return 'عذراً، لم أتمكن من الإجابة.';
        }

        if (typeof content === 'string') {
            return content;
        }

        return content
            .map(chunk => {
                if ('text' in chunk) return chunk.text;
                return '';
            })
            .join('');
    } catch (error) {
        console.error('Error calling Mistral AI:', error);

        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                return 'خطأ: مفتاح API غير صحيح. الرجاء التحقق من الإعدادات.';
            }
            if (error.message.includes('network') || error.message.includes('fetch')) {
                return 'خطأ في الاتصال. الرجاء التحقق من اتصال الإنترنت.';
            }
        }

        return 'عذراً، حدث خطأ. الرجاء المحاولة مرة أخرى.';
    }
}

export function getWelcomeMessage(): string {
    return 'السلام عليكم ورحمة الله وبركاته! 🌙\n\nأنا مساعدك الإسلامي الذكي. يمكنني مساعدتك في:\n\n• الإجابة على أسئلتك عن الإسلام\n• شرح آيات القرآن والأحاديث\n• توضيح أحكام العبادات\n• تقديم النصائح الإسلامية\n\nكيف يمكنني مساعدتك اليوم؟';
}

export async function generateChatTitle(messages: { role: 'user' | 'assistant', content: string }[]): Promise<string> {
    try {
        if (!MISTRAL_API_KEY) return 'محادثة جديدة';

        // Use first 3 messages for context to keep it fast
        const conversationSummary = messages.slice(0, 3).map(m => m.content).join('\n');

        const chatResponse = await client.chat.complete({
            model: 'mistral-small-latest',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant that generates extremely short, descriptive chat titles (max 4 words) in the user\'s language. Output ONLY the title, no quotes or extra text.'
                },
                {
                    role: 'user',
                    content: `Generate a title for this conversation:\n\n${conversationSummary}`
                }
            ],
            temperature: 0.5,
            maxTokens: 15,
        });

        const content = chatResponse.choices?.[0]?.message?.content;
        if (typeof content === 'string') {
            return content.replace(/["'«»]/g, '').trim();
        }
        return 'محادثة';
    } catch (error) {
        console.error('Error generating title:', error);
        return 'محادثة';
    }
}

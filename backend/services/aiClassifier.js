import { GoogleGenerativeAI } from '@google/generative-ai';

const client = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// 🔥 Improved keyword detection
const HIGH_KEYWORDS = [
  'urgent', 'critical', 'emergency', 'asap',
  'down', 'outage', 'breach', 'incident',
  'failure', 'crash', 'not working',
  'prod down', 'production down', 'server down'
];

const MEDIUM_KEYWORDS = [
  'important', 'issue', 'problem', 'broken',
  'failing', 'delayed', 'warning',
  'attention', 'concern', 'bug'
];

// 🔁 Fallback classifier
function keywordFallback(content) {
  const lower = content.toLowerCase();

  if (HIGH_KEYWORDS.some(k => lower.includes(k))) {
    return {
      urgency: 'high',
      reason: 'Detected production/system failure keywords'
    };
  }

  if (MEDIUM_KEYWORDS.some(k => lower.includes(k))) {
    return {
      urgency: 'medium',
      reason: 'Detected issue-related keywords'
    };
  }

  return {
    urgency: 'low',
    reason: 'No urgency signals detected'
  };
}

// 🔁 Retry with exponential backoff
async function retryGenerate(model, prompt, retries = 3) {
  let delay = 500;

  for (let i = 0; i < retries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      if (err.status === 503 && i < retries - 1) {
        console.warn(`Retrying AI call... attempt ${i + 1}`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

// 🧠 Main classifier
export async function classifyUrgency(content) {
  if (!client) return keywordFallback(content);

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash'
    });

    const safeContent = content.replace(/"/g, "'");

    const prompt = `
Classify the urgency of this workplace notification message into exactly one of: high, medium, low.

Definitions:
- high = requires immediate action (outages, production issues, security breaches)
- medium = important but not time-critical (bugs, delays, issues needing attention)
- low = informational or routine (updates, greetings)

Message: "${safeContent}"

Respond ONLY with a valid JSON object.
Do not include any text before or after the JSON.

Format:
{"urgency":"high|medium|low","reason":"one sentence explanation"}
`;

    const result = await retryGenerate(model, prompt);
    const text = result.response.text().trim();

    console.log('AI raw response:', text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON format from AI');

    const parsed = JSON.parse(jsonMatch[0]);

    if (!['high', 'medium', 'low'].includes(parsed.urgency)) {
      throw new Error('Invalid urgency value');
    }

    return {
      urgency: parsed.urgency,
      reason: parsed.reason
    };

  } catch (err) {
    console.error('aiClassifier error:', err.message);

    return keywordFallback(content);
  }
}
import { ActivitySummary, ChatMessage } from '../types';
import { getDailyActivitySummary } from './activitySummaryService';

const GEMINI_MODEL = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_HISTORY_SENT = 20;
const RATE_LIMIT_MS = 1500;

let lastRequestTime = 0;

function buildSystemPrompt(summary: ActivitySummary): string {
  const now = new Date();
  const timeOfDay = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening';

  const activityLine =
    summary.sessionCount > 0
      ? `Today so far: ${summary.sessionCount} workout session${summary.sessionCount > 1 ? 's' : ''}, ` +
        `${summary.caloriesBurnedToday} kcal burned, ${summary.totalWorkoutMinutes} minutes of activity. ` +
        `Activities: ${summary.activityTypes.join(', ')}.`
      : 'No workout sessions recorded today yet.';

  return [
    'You are a fitness and nutrition coach in a mobile activity tracker.',
    '',
    'Style rules:',
    '- Be direct. Match response length to the question — short answers for simple questions, longer for complex ones',
    '- Friendly but brief — no fluff, no motivational speeches',
    '- Give specific, actionable advice',
    '- Never diagnose injuries or prescribe medication',
    '- Use metric units (kg, kcal)',
    '',
    'User context:',
    `- ${timeOfDay}, weight: ${summary.weightKg} kg`,
    `- ${activityLine}`,
    '',
    'Use this context naturally. Don\'t repeat the data back unless asked.',
  ].join('\n');
}

function formatHistoryForApi(
  messages: ChatMessage[],
): Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> {
  const recent = messages.slice(-MAX_HISTORY_SENT);
  return recent.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
}

export interface CoachResponse {
  success: boolean;
  message: string;
}

export async function sendCoachMessage(
  userMessage: string,
  history: ChatMessage[],
): Promise<CoachResponse> {
  // Rate limiting
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message:
        'The AI Coach is not configured yet. Add your Gemini API key as EXPO_PUBLIC_GEMINI_API_KEY in your .env file to enable this feature.',
    };
  }

  try {
    const summary = await getDailyActivitySummary();
    const systemPrompt = buildSystemPrompt(summary);

    const conversationHistory = formatHistoryForApi(history);
    conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 512,
      },
    };

    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return {
        success: false,
        message: 'Something went wrong reaching the AI service. Please try again in a moment.',
      };
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      'I wasn\'t able to generate a response. Please try again.';

    return { success: true, message: text.trim() };
  } catch (error) {
    console.error('AI Coach error:', error);
    return {
      success: false,
      message: 'Unable to connect to the AI service. Check your internet connection and try again.',
    };
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatMessage } from '../types';

const CHAT_KEY = 'ai_chat_history';
const MAX_STORED_MESSAGES = 100;

export async function loadChatHistory(): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX_STORED_MESSAGES);
  await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
}

export async function appendMessage(message: ChatMessage): Promise<ChatMessage[]> {
  const history = await loadChatHistory();
  const updated = [...history, message];
  await saveChatHistory(updated);
  return updated;
}

export async function clearChatHistory(): Promise<void> {
  await AsyncStorage.removeItem(CHAT_KEY);
}

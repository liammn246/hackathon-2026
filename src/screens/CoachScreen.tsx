import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ChatMessage } from '../types';
import { loadChatHistory, saveChatHistory, clearChatHistory } from '../storage/chatStorage';
import { sendCoachMessage } from '../services/aiCoachService';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hey! I'm your AI fitness coach. Ask me anything about recovery, nutrition, or your workout plan. I can see your activity data, so my advice is personalized to your day.",
  timestamp: Date.now(),
};

export default function CoachScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // Load chat history when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadChatHistory().then((history) => {
        if (history.length === 0) {
          setMessages([WELCOME_MESSAGE]);
        } else {
          setMessages(history);
        }
      });
    }, []),
  );

  function scrollToEnd() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  async function handleSend(text: string) {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedWithUser = [...messages, userMessage];
    setMessages(updatedWithUser);
    setIsLoading(true);
    scrollToEnd();

    const response = await sendCoachMessage(text, messages);

    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.message,
      timestamp: Date.now(),
    };

    const updatedWithResponse = [...updatedWithUser, assistantMessage];
    setMessages(updatedWithResponse);
    setIsLoading(false);
    await saveChatHistory(updatedWithResponse);
    scrollToEnd();
  }

  async function handleClear() {
    await clearChatHistory();
    setMessages([{ ...WELCOME_MESSAGE, timestamp: Date.now() }]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>AI Coach</Text>
          <Text style={styles.subtitle}>Fitness & Nutrition</Text>
        </View>
        {messages.length > 1 && (
          <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollToEnd()}
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2C2C2E',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  clearText: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '600',
  },
  messageList: {
    paddingVertical: 16,
  },
});

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { ChatMessage } from '../types';

/** Parse markdown bold (**text**), italic (*text*), and bold-italic (***text***) into styled <Text> nodes. */
function renderMarkdown(content: string, baseStyle: TextStyle): ReactNode[] {
  // Split by markdown patterns: ***bold italic***, **bold**, *italic*
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // ***bold italic***
      nodes.push(
        <Text key={match.index} style={[baseStyle, styles.bold, styles.italic]}>
          {match[2]}
        </Text>,
      );
    } else if (match[3]) {
      // **bold**
      nodes.push(
        <Text key={match.index} style={[baseStyle, styles.bold]}>
          {match[3]}
        </Text>,
      );
    } else if (match[4]) {
      // *italic*
      nodes.push(
        <Text key={match.index} style={[baseStyle, styles.italic]}>
          {match[4]}
        </Text>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }

  return nodes;
}

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const textColor = isUser ? styles.textUser : styles.textAssistant;

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.text, textColor]}>
          {renderMarkdown(message.content, textColor)}
        </Text>
        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeAssistant]}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
}

export function TypingIndicator() {
  return (
    <View style={styles.row}>
      <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 21,
  },
  textUser: {
    color: '#fff',
  },
  textAssistant: {
    color: '#E5E5EA',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  time: {
    fontSize: 10,
    marginTop: 4,
  },
  timeUser: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  timeAssistant: {
    color: '#636366',
  },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#636366',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.9,
  },
});

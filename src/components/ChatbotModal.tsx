import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
  Dimensions,
  Vibration,
} from 'react-native';
import {
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
  BORDERRADIUS,
} from '../theme/theme';
import CustomIcon from './CustomIcon';
import chatbotService, { ChatMessage, UserContext } from '../services/chatbotService';

const { height: screenHeight } = Dimensions.get('window');

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
  userContext?: UserContext;
  apiKey?: string; // Gemini API key
}

interface TypingIndicatorProps {
  isVisible: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible }) => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      const createDotAnimation = (animValue: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );

      const animations = [
        createDotAnimation(dot1Anim, 0),
        createDotAnimation(dot2Anim, 150),
        createDotAnimation(dot3Anim, 300),
      ];

      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    }
  }, [isVisible, dot1Anim, dot2Anim, dot3Anim]);

  if (!isVisible) return null;

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDotsContainer}>
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: dot1Anim,
                transform: [
                  {
                    scale: dot1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: dot2Anim,
                transform: [
                  {
                    scale: dot2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: dot3Anim,
                transform: [
                  {
                    scale: dot3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
        <Text style={styles.typingText}>Coffee Bot is typing...</Text>
      </View>
    </View>
  );
};

const ChatbotModal: React.FC<ChatbotModalProps> = ({
  visible,
  onClose,
  userContext,
  apiKey,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Initialize chatbot when modal opens
  useEffect(() => {
    if (visible) {
      initializeChatbot();
      startEnterAnimation();
    } else {
      startExitAnimation();
    }
  }, [visible]);

  const startEnterAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startExitAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const initializeChatbot = async () => {
    if (!apiKey) {
      setError('API key not configured. Please contact support.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize with API key
      const initialized = chatbotService.initializeWithApiKey(apiKey);
      if (!initialized) {
        throw new Error('Failed to initialize chatbot service');
      }

      // Start chat session with user context
      const chatStarted = await chatbotService.startChat(userContext);
      if (!chatStarted) {
        throw new Error('Failed to start chat session');
      }

      setChatInitialized(true);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `welcome_${Date.now()}`,
        text: `Hello${userContext?.firstName ? ` ${userContext.firstName}` : ''}! ☕ Welcome to The Coffee app support! I'm here to help you discover amazing coffees, navigate the app, and answer any questions you have. What can I help you with today?`,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages([welcomeMessage]);
      setSuggestions(['Coffee recommendations', 'App features', 'Order help']);
      
    } catch (error: any) {
      console.error('Chatbot initialization error:', error);
      setError('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || !chatInitialized) return;

    // Clear input if using typed message
    if (!messageText) {
      setInputText('');
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setSuggestions([]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Check for quick responses first
      const quickResponse = chatbotService.getQuickResponse(textToSend);
      
      let response;
      if (quickResponse) {
        response = {
          success: true,
          message: quickResponse,
          suggestions: ['Tell me more', 'Coffee menu', 'Order help'],
        };
        // Add small delay to simulate typing
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        response = await chatbotService.sendMessage(textToSend, userContext);
      }

      if (response.success && response.message) {
        const botMessage: ChatMessage = {
          id: `bot_${Date.now()}`,
          text: response.message,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
        
        if (response.suggestions && response.suggestions.length > 0) {
          setSuggestions(response.suggestions);
        }

        // Haptic feedback for successful response
        Vibration.vibrate(50);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        text: 'Sorry, I encountered an issue. Please try again or contact support.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      setSuggestions(['Try again', 'Contact support', 'App features']);
    } finally {
      setIsTyping(false);
      
      // Scroll to bottom after response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleClose = () => {
    // Clear chat when closing
    chatbotService.endChat();
    setMessages([]);
    setSuggestions([]);
    setChatInitialized(false);
    setError(null);
    onClose();
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessageContainer : styles.botMessageContainer,
    ]}>
      {!item.isUser && (
        <View style={styles.botAvatarContainer}>
          <CustomIcon
            name="cafe"
            size={FONTSIZE.size_16}
            color={COLORS.primaryWhiteHex}
          />
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.botBubble,
      ]}>
        <Text style={[
          styles.messageText,
          item.isUser ? styles.userMessageText : styles.botMessageText,
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          item.isUser ? styles.userMessageTime : styles.botMessageTime,
        ]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      
      {item.isUser && (
        <View style={styles.userAvatarContainer}>
          <CustomIcon
            name="person"
            size={FONTSIZE.size_16}
            color={COLORS.primaryWhiteHex}
          />
        </View>
      )}
    </View>
  );

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Quick replies:</Text>
        <View style={styles.suggestionsRow}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSuggestionPress(suggestion)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.botAvatarHeader}>
                <CustomIcon
                  name="cafe"
                  size={FONTSIZE.size_20}
                  color={COLORS.primaryWhiteHex}
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>Coffee Bot</Text>
                <Text style={styles.headerSubtitle}>
                  {chatInitialized ? 'Online • Ready to help' : 'Connecting...'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <CustomIcon
                name="close"
                size={FONTSIZE.size_24}
                color={COLORS.primaryWhiteHex}
              />
            </TouchableOpacity>
          </View>

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <CustomIcon
                name="warning"
                size={FONTSIZE.size_20}
                color={COLORS.primaryRedHex}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={initializeChatbot}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
              <Text style={styles.loadingText}>Starting Coffee Bot...</Text>
            </View>
          )}

          {/* Chat Content */}
          {!error && !isLoading && (
            <KeyboardAvoidingView
              style={styles.chatContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              {/* Messages */}
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }}
              />

              {/* Typing Indicator */}
              <TypingIndicator isVisible={isTyping} />

              {/* Suggestions */}
              {renderSuggestions()}

              {/* Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Ask about coffee, orders, or app features..."
                    placeholderTextColor={COLORS.primaryLightGreyHex}
                    multiline
                    maxLength={500}
                    editable={chatInitialized && !isTyping}
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      (!inputText.trim() || !chatInitialized || isTyping) && styles.sendButtonDisabled,
                    ]}
                    onPress={() => sendMessage()}
                    disabled={!inputText.trim() || !chatInitialized || isTyping}
                    activeOpacity={0.7}
                  >
                    <CustomIcon
                      name="send"
                      size={FONTSIZE.size_18}
                      color={COLORS.primaryWhiteHex}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: screenHeight * 0.85,
    backgroundColor: COLORS.primaryBlackHex,
    borderTopLeftRadius: BORDERRADIUS.radius_25,
    borderTopRightRadius: BORDERRADIUS.radius_25,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_12,
  },
  botAvatarHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  headerSubtitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
  },
  closeButton: {
    padding: SPACING.space_8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_20,
    gap: SPACING.space_16,
  },
  errorText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryRedHex,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
  },
  retryButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.space_16,
  },
  loadingText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: SPACING.space_16,
    paddingHorizontal: SPACING.space_16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.space_16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.space_8,
  },
  userAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryGreyHex,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.space_8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
  },
  userBubble: {
    backgroundColor: COLORS.primaryOrangeHex,
    borderBottomRightRadius: SPACING.space_4,
  },
  botBubble: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderBottomLeftRadius: SPACING.space_4,
  },
  messageText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    lineHeight: 20,
  },
  userMessageText: {
    color: COLORS.primaryWhiteHex,
  },
  botMessageText: {
    color: COLORS.primaryWhiteHex,
  },
  messageTime: {
    fontSize: FONTSIZE.size_10,
    fontFamily: FONTFAMILY.poppins_regular,
    marginTop: SPACING.space_4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  botMessageTime: {
    color: COLORS.primaryLightGreyHex,
  },
  typingContainer: {
    paddingHorizontal: SPACING.space_16,
    marginBottom: SPACING.space_8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDarkGreyHex,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
    borderBottomLeftRadius: SPACING.space_4,
    maxWidth: '75%',
    gap: SPACING.space_12,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.space_4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryOrangeHex,
  },
  typingText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryLightGreyHex,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    paddingHorizontal: SPACING.space_16,
    paddingBottom: SPACING.space_12,
  },
  suggestionsTitle: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.space_8,
  },
  suggestionChip: {
    backgroundColor: COLORS.primaryGreyHex,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_15,
    borderWidth: 1,
    borderColor: COLORS.primaryOrangeHex,
  },
  suggestionText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  inputContainer: {
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
    backgroundColor: COLORS.primaryBlackHex,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.primaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_20,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    gap: SPACING.space_12,
  },
  textInput: {
    flex: 1,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.primaryWhiteHex,
    maxHeight: 100,
    minHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
    opacity: 0.5,
  },
});

export default ChatbotModal;

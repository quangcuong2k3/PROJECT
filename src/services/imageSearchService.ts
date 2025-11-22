import { Alert } from 'react-native';
//import { GeminiModelTester } from '../utils/geminiModelTester';

// Optional imports with error handling
let ImagePicker: any = null;

try {
  ImagePicker = require('expo-image-picker');
} catch (error) {
  console.warn('expo-image-picker not available:', error);
}

export interface ImageSearchResult {
  confidence: number;
  productType: 'coffee' | 'bean';
  suggestedNames: string[];
  characteristics: {
    roastLevel?: 'Light' | 'Medium' | 'Dark';
    beanType?: 'Arabica' | 'Robusta' | 'Liberica' | 'Excelsa';
    brewMethod?: string;
    color?: string;
  };
}

export interface ImageAnalysisResponse {
  success: boolean;
  results?: ImageSearchResult[];
  error?: string;
  isCoffeeRelated?: boolean;
}

class ImageSearchService {
  // Updated to use the latest Gemini 2.0 model
  private readonly GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
  private readonly GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  //private modelTester: GeminiModelTester | null = null;

  /**
   * Request camera permissions
   */
  async requestCameraPermissions(): Promise<boolean> {
    try {
      if (!ImagePicker) {
        console.warn('ImagePicker module not available');
        return false;
      }
      
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập camera',
          'Vui lòng cấp quyền truy cập camera để sử dụng tính năng tìm kiếm bằng hình ảnh.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      if (!ImagePicker) {
        console.warn('ImagePicker module not available');
        return false;
      }
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập thư viện',
          'Vui lòng cấp quyền truy cập thư viện để chọn hình ảnh.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting media library permissions:', error);
      return false;
    }
  }

  /**
   * Take photo with camera
   */
  async takePhoto(): Promise<string | null> {
    try {
      if (!ImagePicker) {
        Alert.alert('Lỗi', 'Tính năng chọn hình ảnh không khả dụng trên thiết bị này.');
        return null;
      }
      
      const hasPermission = await this.requestCameraPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
      return null;
    }
  }

  /**
   * Pick image from gallery
   */
  async pickImage(): Promise<string | null> {
    try {
      if (!ImagePicker) {
        Alert.alert('Lỗi', 'Tính năng chọn hình ảnh không khả dụng trên thiết bị này.');
        return null;
      }
      
      const hasPermission = await this.requestMediaLibraryPermissions();
      if (!hasPermission) return null;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn hình ảnh. Vui lòng thử lại.');
      return null;
    }
  }

  /**
   * Convert image to base64 for API calls
   */
  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  /**
   * Analyze image using Google Gemini AI
   */
  async analyzeImage(imageUri: string): Promise<ImageAnalysisResponse> {
    try {
      console.log('🤖 Starting Gemini AI image analysis...');
      
      if (!this.GEMINI_API_KEY || this.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.error('❌ Gemini API key not configured');
        return {
          success: false,
          error: 'Chức năng tìm kiếm bằng hình ảnh chưa được cấu hình. Vui lòng sử dụng tìm kiếm văn bản.',
        };
      }

      // Initialize model tester if not already done
      // if (!this.modelTester) {
      //   //this.modelTester = new GeminiModelTester(this.GEMINI_API_KEY);
      // }

      // Convert image to base64
      const base64Image = await this.imageToBase64(imageUri);
      
      // Create the prompt for coffee/beverage analysis
      const prompt = `Analyze this image and determine if it shows coffee, coffee beans, or coffee-related beverages. 

IMPORTANT: Only respond with coffee-related analysis if the image actually contains:
- Coffee drinks (espresso, latte, cappuccino, americano, macchiato, black coffee, etc.)
- Coffee beans (arabica, robusta, liberica, excelsa)
- Coffee-making equipment with coffee visible

If the image does NOT contain coffee, coffee beans, or coffee beverages, respond with: "NOT_COFFEE_RELATED"

If it IS coffee-related, provide a JSON response with this exact structure:
{
  "isCoffeeRelated": true,
  "results": [
    {
      "confidence": 0.85,
      "productType": "coffee" or "bean",
      "suggestedNames": ["Cappuccino", "Latte"],
      "characteristics": {
        "roastLevel": "Light" or "Medium" or "Dark" (for beans only),
        "beanType": "Arabica" or "Robusta" or "Liberica" or "Excelsa" (for beans only),
        "brewMethod": "description of brewing method" (for drinks only),
        "color": "description of color"
      }
    }
  ]
}

Analyze the image now:`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1000,
        }
      };

      console.log('🌐 Sending request to Gemini API...');
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${this.GEMINI_API_ENDPOINT}?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        
        let errorMessage = 'Không thể phân tích hình ảnh. Vui lòng thử lại.';
        
        if (response.status === 401) {
          errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra cấu hình.';
        } else if (response.status === 403) {
          errorMessage = 'Không có quyền truy cập API. Vui lòng kiểm tra API key.';
        } else if (response.status === 404) {
          errorMessage = 'Model AI không khả dụng. Đang tìm model khả dụng...';
          // Try to find an available model dynamically
          // return this.tryDynamicModelSelection(imageUri);
        } else if (response.status === 429) {
          errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.';
        } else if (response.status >= 500) {
          errorMessage = 'Lỗi server AI. Vui lòng thử lại sau.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');
      
      return this.parseGeminiResponse(data);
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);
      
      let errorMessage = 'Không thể kết nối đến dịch vụ AI. Vui lòng kiểm tra kết nối mạng.';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Phân tích hình ảnh mất quá nhiều thời gian. Vui lòng thử lại.';
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Lỗi xử lý dữ liệu từ AI. Vui lòng thử lại.';
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Dynamically find and use an available model
   */
  // private async tryDynamicModelSelection(imageUri: string): Promise<ImageAnalysisResponse> {
  //   try {
  //     console.log('🔍 Searching for available Gemini models...');
      
  //     // if (!this.modelTester) {
  //     //   this.modelTester = new GeminiModelTester(this.GEMINI_API_KEY);
  //     // }

  //     // const availableEndpoint = await this.modelTester.getFirstAvailableImageModel();
      
  //     // if (!availableEndpoint) {
  //     //   console.log('❌ No available models found');
  //     //   return {
  //     //     success: false,
  //     //     error: 'Dịch vụ AI hiện tại không khả dụng. Vui lòng thử lại sau hoặc sử dụng tìm kiếm văn bản.',
  //     //   };
  //     // }

  //     console.log('✅ Found available model, attempting analysis...');
  //     // return this.analyzeWithEndpoint(imageUri, availableEndpoint);
  //   } catch (error) {
  //     console.error('Dynamic model selection failed:', error);
  //     return this.tryFallbackModel(imageUri);
  //   }
  // }

  /**
   * Try multiple fallback models when primary model is not available
   */
  private async tryFallbackModel(imageUri: string): Promise<ImageAnalysisResponse> {
    const fallbackModels = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    ];

    for (let i = 0; i < fallbackModels.length; i++) {
      const endpoint = fallbackModels[i];
      const modelName = endpoint.split('/').pop()?.split(':')[0] || 'unknown';
      
      try {
        console.log(`🔄 Trying fallback model ${i + 1}/${fallbackModels.length}: ${modelName}...`);
        
        const base64Image = await this.imageToBase64(imageUri);
        
        const prompt = `Analyze this image and determine if it shows coffee, coffee beans, or coffee-related beverages. 

IMPORTANT: Only respond with coffee-related analysis if the image actually contains:
- Coffee drinks (espresso, latte, cappuccino, americano, macchiato, black coffee, etc.)
- Coffee beans (arabica, robusta, liberica, excelsa)
- Coffee-making equipment with coffee visible

If the image does NOT contain coffee, coffee beans, or coffee beverages, respond with: "NOT_COFFEE_RELATED"

If it IS coffee-related, provide a JSON response with this exact structure:
{
  "isCoffeeRelated": true,
  "results": [
    {
      "confidence": 0.85,
      "productType": "coffee" or "bean",
      "suggestedNames": ["Cappuccino", "Latte"],
      "characteristics": {
        "roastLevel": "Light" or "Medium" or "Dark" (for beans only),
        "beanType": "Arabica" or "Robusta" or "Liberica" or "Excelsa" (for beans only),
        "brewMethod": "description of brewing method" (for drinks only),
        "color": "description of color"
      }
    }
  ]
}

Analyze the image now:`;

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: prompt
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1000,
          }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${endpoint}?key=${this.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Fallback model ${modelName} succeeded!`);
          return this.parseGeminiResponse(data);
        } else {
          const errorText = await response.text();
          console.log(`❌ Fallback model ${modelName} failed: ${response.status}`);
          // Continue to next model
        }
      } catch (error) {
        console.log(`❌ Fallback model ${modelName} error:`, error);
        // Continue to next model
      }
    }

    // If all models fail, return a user-friendly error
    console.error('🚫 All Gemini models failed');
    return {
      success: false,
      error: 'Dịch vụ AI hiện tại không khả dụng. Vui lòng thử lại sau hoặc sử dụng tìm kiếm văn bản.',
    };
  }

  /**
   * Parse Gemini AI response
   */
  private parseGeminiResponse(data: any): ImageAnalysisResponse {
    try {
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('No content in Gemini response');
      }

      console.log('📝 Gemini response content:', content);

      // Check if image is not coffee-related
      if (content.includes('NOT_COFFEE_RELATED')) {
        return {
          success: true,
          isCoffeeRelated: false,
          results: [],
          error: 'Hình ảnh này không có liên quan đến cà phê, hạt cà phê hoặc đồ uống cà phê. Vui lòng chọn hình ảnh khác có chứa cà phê, hạt cà phê hoặc đồ uống cà phê.',
        };
      }

      // Try to parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        
        if (parsedResponse.isCoffeeRelated && parsedResponse.results) {
          return {
            success: true,
            isCoffeeRelated: true,
            results: parsedResponse.results,
          };
        }
      }

      // If we can't parse JSON, try to extract information manually
      return this.extractCoffeeInfoFromText(content);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        success: false,
        error: 'Không thể xử lý kết quả từ AI. Vui lòng thử lại với hình ảnh khác.',
      };
    }
  }

  /**
   * Extract coffee information from text response
   */
  private extractCoffeeInfoFromText(text: string): ImageAnalysisResponse {
    const lowerText = text.toLowerCase();
    
    // Check for coffee-related keywords
    const coffeeKeywords = ['coffee', 'espresso', 'latte', 'cappuccino', 'americano', 'macchiato', 'bean', 'arabica', 'robusta'];
    const hasCoffeeKeywords = coffeeKeywords.some(keyword => lowerText.includes(keyword));
    
    if (!hasCoffeeKeywords) {
      return {
        success: true,
        isCoffeeRelated: false,
        results: [],
        error: 'Hình ảnh này không có liên quan đến cà phê. Vui lòng chọn hình ảnh có chứa cà phê hoặc hạt cà phê.',
      };
    }

    // Create a basic result based on detected keywords
    const result: ImageSearchResult = {
      confidence: 0.7,
      productType: lowerText.includes('bean') ? 'bean' : 'coffee',
      suggestedNames: [],
      characteristics: {},
    };

    // Extract suggested names
    if (lowerText.includes('cappuccino')) result.suggestedNames.push('Cappuccino');
    if (lowerText.includes('latte')) result.suggestedNames.push('Latte');
    if (lowerText.includes('espresso')) result.suggestedNames.push('Espresso');
    if (lowerText.includes('americano')) result.suggestedNames.push('Americano');
    if (lowerText.includes('macchiato')) result.suggestedNames.push('Macchiato');
    if (lowerText.includes('arabica')) result.suggestedNames.push('Arabica Beans');
    if (lowerText.includes('robusta')) result.suggestedNames.push('Robusta Beans');

    if (result.suggestedNames.length === 0) {
      result.suggestedNames.push(result.productType === 'bean' ? 'Coffee Beans' : 'Coffee');
    }

    return {
      success: true,
      isCoffeeRelated: true,
      results: [result],
    };
  }

  /**
   * Convert image analysis results to search terms optimized for database search
   */
  generateSearchTermsFromImage(results: ImageSearchResult[]): string[] {
    const searchTerms: string[] = [];
    
    results.forEach(result => {
      // Add suggested names (highest priority)
      searchTerms.push(...result.suggestedNames);
      
      // Add product type
      if (result.productType === 'coffee') {
        searchTerms.push('Coffee');
      } else if (result.productType === 'bean') {
        searchTerms.push('Bean');
      }
      
      // Add characteristics with database-friendly terms
      if (result.characteristics.roastLevel) {
        searchTerms.push(`${result.characteristics.roastLevel} Roasted`);
        searchTerms.push(result.characteristics.roastLevel);
      }
      
      if (result.characteristics.beanType) {
        searchTerms.push(`${result.characteristics.beanType} Beans`);
        searchTerms.push(result.characteristics.beanType);
      }
      
      if (result.characteristics.brewMethod) {
        searchTerms.push(result.characteristics.brewMethod);
        
        // Add related terms based on brew method
        if (result.characteristics.brewMethod.includes('Espresso')) {
          searchTerms.push('Espresso', 'Strong');
        }
        if (result.characteristics.brewMethod.includes('Steamed Milk')) {
          searchTerms.push('Steamed Milk', 'Milk');
        }
      }
      
      // Add color-based inferences
      if (result.characteristics.color) {
        const color = result.characteristics.color.toLowerCase();
        if (color.includes('dark')) {
          searchTerms.push('Dark Roasted', 'Strong');
        } else if (color.includes('light')) {
          searchTerms.push('Light Roasted', 'Mild');
        } else if (color.includes('medium')) {
          searchTerms.push('Medium Roasted');
        }
        
        if (color.includes('foam')) {
          searchTerms.push('Foam', 'Steamed Milk');
        }
      }
    });

    // Add common related terms for better matching
    const enhancedTerms = [...searchTerms];
    
    searchTerms.forEach(term => {
      const lowerTerm = term.toLowerCase();
      
      // Add ingredient-based enhancements
      if (lowerTerm.includes('cappuccino')) {
        enhancedTerms.push('Espresso', 'Steamed Milk', 'Foam');
      } else if (lowerTerm.includes('latte')) {
        enhancedTerms.push('Espresso', 'Steamed Milk');
      } else if (lowerTerm.includes('americano')) {
        enhancedTerms.push('Espresso', 'Hot Water');
      } else if (lowerTerm.includes('macchiato')) {
        enhancedTerms.push('Espresso', 'Steamed Milk');
      } else if (lowerTerm.includes('black coffee')) {
        enhancedTerms.push('Water', 'Coffee');
      }
      
      // Add origin-based enhancements for beans
      if (lowerTerm.includes('arabica')) {
        enhancedTerms.push('South America');
      } else if (lowerTerm.includes('robusta')) {
        enhancedTerms.push('Africa');
      } else if (lowerTerm.includes('liberica')) {
        enhancedTerms.push('West Africa');
      } else if (lowerTerm.includes('excelsa')) {
        enhancedTerms.push('Southeast Asia');
      }
    });

    // Remove duplicates and return
    return [...new Set(enhancedTerms)];
  }

  /**
   * Show image source selection dialog
   */
  showImageSourceDialog(): Promise<'camera' | 'gallery' | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Chọn nguồn hình ảnh',
        'Chọn cách bạn muốn thêm hình ảnh để tìm kiếm',
        [
          {
            text: 'Camera',
            onPress: () => resolve('camera'),
          },
          {
            text: 'Thư viện',
            onPress: () => resolve('gallery'),
          },
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }

  /**
   * Extract suggested names from image analysis results for database search
   */
  extractSuggestedNamesFromResults(results: ImageSearchResult[]): string[] {
    const suggestedNames: string[] = [];
    
    results.forEach(result => {
      // Add only the core suggested names from Gemini (keep it simple)
      suggestedNames.push(...result.suggestedNames);
    });

    // Remove duplicates and empty strings, keep it short
    const uniqueNames = [...new Set(suggestedNames)].filter(name => name.trim().length > 0);
    
    console.log('🎯 Extracted suggested names for database search:', uniqueNames);
    return uniqueNames;
  }

  /**
   * Show manual search input dialog when AI fails
   */
  showManualSearchDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      Alert.prompt(
        'Tìm kiếm thủ công',
        'AI không khả dụng. Vui lòng nhập từ khóa tìm kiếm (ví dụ: cappuccino, arabica, dark roast):',
        [
          {
            text: 'Hủy',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: 'Tìm kiếm',
            onPress: (text) => resolve(text || null),
          },
        ],
        'plain-text',
        '',
        'default'
      );
    });
  }

  /**
   * Test which Gemini models are currently available
   */
  async testAvailableModels(): Promise<string[]> {
    const testModels = [
      'gemini-2.0-flash-exp',
      'gemini-exp-1206', 
      'gemini-2.0-flash-thinking-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest'
    ];

    const availableModels: string[] = [];

    for (const model of testModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        
        const response = await fetch(`${endpoint}?key=${this.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Test"
                  }
                ]
              }
            ]
          }),
        });

        if (response.status !== 404) {
          availableModels.push(model);
          console.log(`✅ Model available: ${model}`);
        } else {
          console.log(`❌ Model not found: ${model}`);
        }
      } catch (error) {
        console.log(`❌ Model test failed: ${model}`, error);
      }
    }

    return availableModels;
  }

  /**
   * Analyze image with a specific endpoint
   */
  private async analyzeWithEndpoint(imageUri: string, endpoint: string): Promise<ImageAnalysisResponse> {
    try {
      const base64Image = await this.imageToBase64(imageUri);
      
      const prompt = `Analyze this image and determine if it shows coffee, coffee beans, or coffee-related beverages. 

IMPORTANT: Only respond with coffee-related analysis if the image actually contains:
- Coffee drinks (espresso, latte, cappuccino, americano, macchiato, black coffee, etc.)
- Coffee beans (arabica, robusta, liberica, excelsa)
- Coffee-making equipment with coffee visible

If the image does NOT contain coffee, coffee beans, or coffee beverages, respond with: "NOT_COFFEE_RELATED"

If it IS coffee-related, provide a JSON response with this exact structure:
{
  "isCoffeeRelated": true,
  "results": [
    {
      "confidence": 0.85,
      "productType": "coffee" or "bean",
      "suggestedNames": ["Cappuccino", "Latte"],
      "characteristics": {
        "roastLevel": "Light" or "Medium" or "Dark" (for beans only),
        "beanType": "Arabica" or "Robusta" or "Liberica" or "Excelsa" (for beans only),
        "brewMethod": "description of brewing method" (for drinks only),
        "color": "description of color"
      }
    }
  ]
}

Analyze the image now:`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1000,
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${endpoint}?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Endpoint ${endpoint} failed:`, response.status, errorText);
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Dynamic model analysis successful');
      
      return this.parseGeminiResponse(data);
    } catch (error) {
      console.error('Endpoint analysis failed:', error);
      throw error;
    }
  }
}

export default new ImageSearchService();
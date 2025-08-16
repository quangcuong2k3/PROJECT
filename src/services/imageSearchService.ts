import { Alert } from 'react-native';

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
  private readonly GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  private readonly GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyA15I39YBZwpHWeNWfDdIGULYRtWRzxh28';

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
          'Camera Permission Required',
          'Please grant camera permission to use image search feature.',
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
          'Media Library Permission Required',
          'Please grant media library permission to select images.',
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
        Alert.alert('Error', 'Image picker not available on this device.');
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
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }

  /**
   * Pick image from gallery
   */
  async pickImage(): Promise<string | null> {
    try {
      if (!ImagePicker) {
        Alert.alert('Error', 'Image picker not available on this device.');
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
      Alert.alert('Error', 'Failed to select image. Please try again.');
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
        console.warn('Gemini API key not configured, using mock analysis');
        return this.mockImageAnalysis(imageUri);
      }

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
      const response = await fetch(`${this.GEMINI_API_ENDPOINT}?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');
      
      return this.parseGeminiResponse(data);
    } catch (error) {
      console.error('Error analyzing image with Gemini:', error);
      
      // Fallback to mock analysis
      console.log('🔄 Falling back to mock analysis...');
      return this.mockImageAnalysis(imageUri);
    }
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
          error: 'This image does not appear to contain coffee, coffee beans, or coffee beverages. Please try with a coffee-related image.',
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
        error: 'Failed to parse AI response. Please try again.',
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
        error: 'This image does not appear to contain coffee-related content. Please try with a coffee or coffee bean image.',
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
   * Mock image analysis for demo purposes (fallback)
   */
  private async mockImageAnalysis(imageUri: string): Promise<ImageAnalysisResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // More realistic mock analysis results based on your database structure
    const mockAnalysisOptions = [
      // Coffee drinks
      {
        confidence: 0.92,
        productType: 'coffee' as const,
        suggestedNames: ['Cappuccino', 'Latte', 'Macchiato'],
        characteristics: {
          brewMethod: 'Espresso-based',
          color: 'Light brown with foam',
        },
      },
      {
        confidence: 0.88,
        productType: 'coffee' as const,
        suggestedNames: ['Americano', 'Black Coffee'],
        characteristics: {
          brewMethod: 'Espresso with hot water',
          color: 'Dark brown',
        },
      },
      {
        confidence: 0.85,
        productType: 'coffee' as const,
        suggestedNames: ['Espresso', 'Strong Coffee'],
        characteristics: {
          brewMethod: 'Espresso',
          color: 'Very dark brown',
        },
      },
      // Coffee beans
      {
        confidence: 0.90,
        productType: 'bean' as const,
        suggestedNames: ['Arabica Beans', 'Medium Roast'],
        characteristics: {
          roastLevel: 'Medium' as const,
          beanType: 'Arabica' as const,
          color: 'Medium brown',
        },
      },
      {
        confidence: 0.87,
        productType: 'bean' as const,
        suggestedNames: ['Robusta Beans', 'Dark Roast'],
        characteristics: {
          roastLevel: 'Dark' as const,
          beanType: 'Robusta' as const,
          color: 'Dark brown',
        },
      },
      {
        confidence: 0.83,
        productType: 'bean' as const,
        suggestedNames: ['Liberica Beans', 'Light Roast'],
        characteristics: {
          roastLevel: 'Light' as const,
          beanType: 'Liberica' as const,
          color: 'Light brown',
        },
      },
    ];

    // Randomly select 1-2 analysis results to simulate real AI behavior
    const numResults = Math.random() > 0.6 ? 2 : 1;
    const selectedResults = mockAnalysisOptions
      .sort(() => Math.random() - 0.5)
      .slice(0, numResults);

    return {
      success: true,
      isCoffeeRelated: true,
      results: selectedResults,
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
        'Select Image Source',
        'Choose how you want to add an image for search',
        [
          {
            text: 'Camera',
            onPress: () => resolve('camera'),
          },
          {
            text: 'Gallery',
            onPress: () => resolve('gallery'),
          },
          {
            text: 'Cancel',
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
}

export default new ImageSearchService(); 
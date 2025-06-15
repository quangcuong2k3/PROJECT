# Gemini AI Image Search Implementation

## Overview

This implementation uses Google Gemini AI to analyze coffee images and search your Firestore database using the AI's suggested names. The system is specifically designed to work with your limited product database by using flexible matching and clean search display.

## Your Current Database Structure

**Coffee Products (6 items):**
- C1: Americano
- C2: Black Coffee  
- C3: Cappuccino
- C4: Espresso
- C5: Latte
- C6: Macchiato

**Bean Products (4 items):**
- B1: Robusta Beans
- B2: Arabica Beans
- B3: Liberica Beans
- B4: Excelsa Beans

## How It Works

### 1. Image Analysis with Gemini AI
When a user uploads an image:
```javascript
// Gemini analyzes the image and returns:
{
  "isCoffeeRelated": true,
  "results": [
    {
      "confidence": 0.95,
      "productType": "coffee",
      "suggestedNames": ["Black Coffee", "Americano"],
      "characteristics": {
        "brewMethod": "Likely drip or pour-over",
        "color": "Dark brown"
      }
    }
  ]
}
```

### 2. Suggested Names Extraction
The system extracts suggested names from Gemini's response:
```javascript
// From the example above:
suggestedNames = ["Black Coffee", "Americano"]  // Only core names, kept short
```

**Search Text Display**: Only the first 2 suggested names are shown in the search bar to keep it clean:
- Display: "Black Coffee, Americano" 
- Full search: Uses all suggested names for comprehensive matching 

### 3. Flexible Database Search
The search function checks ALL product fields for matches:

**Example Search Results:**
- **"Black Coffee"** → Direct match with C2 (name: "Black Coffee") ✅
- **"Americano"** → Direct match with C1 (name: "Americano") ✅  
- **"Coffee"** → Matches all Coffee type products (C1-C6) ✅
- **"Espresso"** → Matches C4 (name: "Espresso") + products with "Espresso" in ingredients ✅

### 4. Relevance Scoring
Products are scored based on match quality:
- **Direct name match**: 2.0 points
- **Type match**: 1.5 points  
- **Ingredients match**: 1.2 points
- **Special ingredient match**: 1.0 points
- **Roasted level match**: 0.8 points
- **Description match**: 0.6 points
- **Fuzzy/related terms**: 0.3-0.5 points

## Search Field Coverage

The search checks these product fields:
- `name` (e.g., "Americano", "Black Coffee")
- `description` (e.g., "Espresso is coffee of Italian origin...")
- `ingredients` (e.g., "Espresso, Steamed Milk")
- `special_ingredient` (e.g., "With Steamed Milk")
- `roasted` (e.g., "Medium Roasted")
- `type` (e.g., "Coffee", "Bean")
- `category` (e.g., "coffee", "bean")

## Example Scenarios

### Scenario 1: User uploads cappuccino image
```
Gemini suggests: ["Cappuccino", "Latte", "Espresso"]
Search bar shows: "Cappuccino, Latte"  (first 2 names only)
Database search uses: All 3 suggested names
Results: 
- C3: Cappuccino (score: 2.0) - Direct name match
- C5: Latte (score: 2.0) - Direct name match  
- C4: Espresso (score: 2.0) - Direct name match
- C6: Macchiato (score: 1.2) - Has "Espresso" in ingredients
```

### Scenario 2: User uploads arabica beans image
```
Gemini suggests: ["Arabica Beans", "Medium Roast"]
Search bar shows: "Arabica Beans, Medium Roast"
Database search uses: Both suggested names
Results:
- B2: Arabica Beans (score: 2.0) - Direct name match
- All other products (score: 0.8) - "Medium Roasted" match
```

### Scenario 3: User uploads non-coffee image
```
Gemini response: "NOT_COFFEE_RELATED"
Result: Error message asking user to upload coffee-related image
```

## Key Features

✅ **Smart Coffee Detection**: Rejects non-coffee images  
✅ **Clean Search Display**: Shows only first 2 suggested names in search bar  
✅ **Comprehensive Search**: Uses all suggested names for database matching  
✅ **Flexible Matching**: Searches all product fields  
✅ **Relevance Scoring**: Shows best matches first  
✅ **Fallback System**: Works even if Gemini API fails  
✅ **User Feedback**: Shows what terms are being searched  
✅ **Debug Logging**: Detailed console logs for troubleshooting  

## Environment Setup

Create `.env` file:
```bash
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyA15I39YBZwpHWeNWfDdIGULYRtWRzxh28
```

## Benefits for Your Database

1. **Works with Limited Products**: Flexible matching finds relevant results even with only 10 products
2. **Clean User Interface**: Search bar shows only essential terms, not cluttered
3. **Intelligent Suggestions**: Gemini's AI provides relevant coffee terms
4. **Cross-Category Search**: Can find both coffee drinks and beans
5. **Fuzzy Matching**: Finds related products even if exact matches don't exist
6. **User-Friendly**: Clear feedback when no coffee content is detected

The system is designed to maximize the utility of your existing product database while providing an intelligent, AI-powered search experience with a clean, user-friendly interface.
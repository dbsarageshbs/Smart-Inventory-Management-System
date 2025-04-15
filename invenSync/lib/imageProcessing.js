import { Groq } from 'groq-sdk';

// // Initialize Groq client
const API_KEY = process.env.EXPO_PUBLIC_GROQ_KEY; // Replace with your actual API key or use environment variables
const groq = new Groq({ apiKey: API_KEY });

/**
 * Process product images using Groq API to extract product information
 * 
 * @param {string} frontImageBase64 - Base64 encoded front image
 * @param {string} backImageBase64 - Base64 encoded back image (optional)
 * @returns {Promise<Object>} - Parsed product information
 */
export const processProductImages = async (frontImageBase64, backImageBase64 = null) => {
  try {
    const model = "meta-llama/llama-4-scout-17b-16e-instruct";
    
    // Create system prompt
    const systemContent = `
      You are a product information assistant. Analyze both front and back images of the product.
      Extract and return ONLY the following information in exact format:
      name: [product name]
      expiry: [date in DD-MM-YYYY format or 'Expiration date not found']
      category: [one of: dairy, bakery, snacks, beverages, fruits, vegetables, meat, seafood, grains, condiments, personal care]
      quantity: [Extract the numerical value from text labeled as 'Net Quantity', 'Net Weight', 'Net Volume', 'Net Content', or similar. If not found, predict based on product type and return '1']
      unit: [Extract the unit from text labeled as 'Net Quantity', 'Net Weight', 'Net Volume', 'Net Content', or similar. If not found, predict based on product type and return 'pcs']
      
      Notes for extraction:
      - For expiry: If only manufacturing date and shelf life (in days) are available, calculate the expiry date. Otherwise, return 'Expiration date not found'.
      - For category: If not explicitly visible, predict based on the product name.
      - For quantity: Search for any text containing weight/volume measurements, even if not explicitly labeled as 'Net Quantity'. Include both the numerical value and unit.
      - If the product is not a packaged item, return ONLY 'no item' with no other information. Do not include name, expiry, category, or quantity.
      
      Return ONLY the requested information in the exact format specified above with no additional text or explanations.
    `;
    
    // Create message array
    let messages = [
      {
        role: "system",
        content: systemContent
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Front image of product:"
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${frontImageBase64}`
            }
          }
        ]
      }
    ];
    
    // Add back image if available
    if (backImageBase64) {
      messages[1].content.push(
        {
          type: "text",
          text: "Back image of product:"
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${backImageBase64}`
          }
        }
      );
    }
    
    // Call Groq API
    const response = await groq.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.5,
      max_tokens: 500
    });
    
    // Extract and return content
    return response.choices[0].message.content;
    
  } catch (error) {
    console.error("Error processing product images with Groq API:", error);
    throw new Error("Failed to process images with AI. Please try again or add the item manually.");
  }
};

/**
 * Parse the LLM response to extract structured product information
 * 
 * @param {string} responseText - Text response from LLM
 * @returns {Object} - Structured product information
 */
export const parseProductInfo = (responseText) => {
  try {
    const lines = responseText.trim().split('\n');
    const productData = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(': ');
      if (key && value) {
        productData[key.trim()] = value.trim();
      }
    });
    
    return productData;
  } catch (error) {
    console.error("Error parsing product info:", error);
    throw new Error("Failed to parse product information");
  }
};
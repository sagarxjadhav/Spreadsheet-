// frontend/src/utils/api.js

/**
 * Utility function for making API calls with exponential backoff.
 * This helps in retrying failed requests due to transient network issues or rate limits.
 * @param {Function} apiCall - The async function that performs the API request.
 * @param {number} retries - Maximum number of retries.
 * @param {number} delay - Initial delay in milliseconds before the first retry.
 * @returns {Promise<any>} - The result of the successful API call.
 * @throws {Error} - If the API call fails after all retries.
 */
const callApiWithBackoff = async (apiCall, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`API call failed, retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential increase in delay
      } else {
        throw error; // Re-throw error if all retries fail
      }
    }
  }
};

/**
 * Calls the Gemini API to generate structured data based on a user prompt.
 * The response is expected in a CSV-like format.
 * @param {string} prompt - The user's request for data generation.
 * @returns {Promise<string>} - The generated text data.
 * @throws {Error} - If the API call fails or returns an unexpected response.
 */
export const generateData = async (prompt) => {
  const fullPrompt = `Generate structured data in a table format (CSV-like, but just values separated by commas, no headers unless explicitly requested in prompt) based on the following request. Each row should be on a new line. Do not include markdown table formatting.
  Request: ${prompt}
  Example:
  Apple,Red,Fruit
  Banana,Yellow,Fruit
  Carrot,Orange,Vegetable`;

  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: fullPrompt }] });
  const payload = { contents: chatHistory };
  // The API key is provided by the Canvas environment at runtime.
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  return callApiWithBackoff(async () => {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      return result.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Failed to get content from AI response. Response structure unexpected.');
    }
  });
};

/**
 * Calls the Gemini API to summarize provided text content concisely.
 * @param {string} content - The text content to be summarized.
 * @returns {Promise<string>} - The generated summary.
 * @throws {Error} - If the API call fails or returns an unexpected response.
 */
export const summarizeCellContent = async (content) => {
  const prompt = `Summarize the following text concisely:\n\n"${content}"`;
  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: prompt }] });
  const payload = { contents: chatHistory };
  // The API key is provided by the Canvas environment at runtime.
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  return callApiWithBackoff(async () => {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
      return result.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Failed to get summary from AI response. Response structure unexpected.');
    }
  });
};

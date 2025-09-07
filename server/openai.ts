import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface ListenerCategory {
  category: string;
  description: string;
  percentage: number;
  characteristics: string[];
}

export interface ListenerInsights {
  categories: ListenerCategory[];
  overallSentiment: {
    rating: number;
    confidence: number;
  };
  engagement_level: "low" | "medium" | "high";
  recommendations: string[];
}

export async function categorizeListeners(
  chatMessages: Array<{ message: string; userId: string; createdAt: string }>,
  streamData: { genre?: string; currentTrack?: string; description?: string }
): Promise<ListenerInsights> {
  try {
    const messagesText = chatMessages
      .slice(-50) // Last 50 messages
      .map(msg => msg.message)
      .join('\n');

    const prompt = `
Analyze the following chat messages from a DJ live stream and provide insights about the listener categories and engagement.

Stream Context:
- Genre: ${streamData.genre || 'Unknown'}
- Current Track: ${streamData.currentTrack || 'Unknown'}
- Description: ${streamData.description || 'Live DJ Set'}

Chat Messages:
${messagesText}

Please categorize the listeners and provide insights in the following JSON format:
{
  "categories": [
    {
      "category": "Category Name",
      "description": "Brief description of this listener type",
      "percentage": 0-100,
      "characteristics": ["trait1", "trait2", "trait3"]
    }
  ],
  "overallSentiment": {
    "rating": 1-5,
    "confidence": 0-1
  },
  "engagement_level": "low|medium|high",
  "recommendations": ["suggestion1", "suggestion2", "suggestion3"]
}

Base your analysis on message content, frequency, music requests, emotional expressions, and interaction patterns.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert music and audience analytics AI. Analyze DJ stream chat data to categorize listeners and provide actionable insights for DJs to improve their performance and audience engagement."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    // Validate and ensure percentages add up to 100
    const totalPercentage = result.categories.reduce((sum: number, cat: any) => sum + cat.percentage, 0);
    if (totalPercentage !== 100) {
      result.categories = result.categories.map((cat: any) => ({
        ...cat,
        percentage: Math.round((cat.percentage / totalPercentage) * 100)
      }));
    }

    return result as ListenerInsights;
  } catch (error) {
    console.error('Error categorizing listeners:', error);
    
    // Return default insights on error
    return {
      categories: [
        {
          category: "General Listeners",
          description: "Mixed audience enjoying the music",
          percentage: 100,
          characteristics: ["Music lovers", "Casual listeners", "Engaged audience"]
        }
      ],
      overallSentiment: {
        rating: 3,
        confidence: 0.5
      },
      engagement_level: "medium",
      recommendations: [
        "Continue with current music style",
        "Encourage more chat interaction",
        "Consider taking song requests"
      ]
    };
  }
}

export async function generateStreamTitle(genre: string, mood: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a creative DJ stream title generator. Create catchy, engaging titles for DJ live streams."
        },
        {
          role: "user",
          content: `Generate a creative and engaging title for a DJ live stream. Genre: ${genre}, Mood: ${mood}. Keep it under 60 characters and make it exciting for listeners.`
        }
      ],
      max_tokens: 50,
      temperature: 0.8,
    });

    return response.choices[0].message.content?.trim() || `${genre} Vibes - Live DJ Set`;
  } catch (error) {
    console.error('Error generating stream title:', error);
    return `${genre} Vibes - Live DJ Set`;
  }
}

import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        this.logger.error('❌ Error: OPENAI_API_KEY is missing!');
    } else {
        this.logger.log(`✅ AI Service ready.`);
    }

    this.openai = new OpenAI({
      apiKey: apiKey || 'missing-key', 
    });
  }

  async generateFilter(userPrompt: string, sampleData?: any): Promise<{ code: string; description: string }> {
    try {
      if (!process.env.OPENAI_API_KEY) {
         throw new Error('OPENAI_API_KEY is missing');
      }

      let contextStr = '';
      if (sampleData) {
        // הגדלנו ל-3000 כדי לתפוס הודעות וואטסאפ ארוכות ומורכבות
        contextStr = `Sample JSON Payload: ${JSON.stringify(sampleData).slice(0, 3000)}`;
      }

      const systemPrompt = `
      You are an expert JavaScript developer for a Webhook Filtering Engine.
      Your goal is to convert natural language requirements into a ROBUST JavaScript boolean expression.

      ### Input Context:
      - Variable 'event' is available.
      - 'event.payload': The JSON body.

      ### CRITICAL RULES FOR ROBUSTNESS:
      1. **Text Search (The "Catch-All" Rule):** If the user asks to check if the event "contains" a word, or "text is X", DO NOT assume the field path (like .body or .message). 
         Instead, convert the whole payload to a string.
         INVALID: event.payload?.body?.includes('word')  <-- DO NOT DO THIS
         VALID:   JSON.stringify(event.payload).includes('word') <-- DO THIS!

      2. **Specific Fields (Numbers/Booleans):**
         Only use specific paths if the user asks for numerical comparisons (e.g. "price > 50").
         ALWAYS use optional chaining (?.).
         Example: event.payload?.order?.price > 50

      3. **Output Format:**
         Return a JSON object with:
         - "code": The boolean expression.
         - "description": A short explanation in HEBREW (עברית).

      ### Examples:
      User: "אם ההודעה מכילה את המילה 'בדיקה'"
      Output: { "code": "JSON.stringify(event.payload).includes('בדיקה')", "description": "מחפש את המילה 'בדיקה' בכל מקום בתוכן האירוע" }

      User: "רק אם הסטטוס הוא 'paid'"
      Output: { "code": "JSON.stringify(event.payload).includes('paid')", "description": "מוודא שהמילה 'paid' קיימת בתוכן האירוע" }
      
      User: "אם המחיר גדול מ-100"
      Output: { "code": "event.payload?.price > 100", "description": "מסנן עסקאות עם מחיר גבוה מ-100" }

      ### Real Data Context:
      ${contextStr}
      `;

      const completion = await this.openai.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        model: 'gpt-4o-mini', 
        max_tokens: 500,
        temperature: 0.1, 
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      
      let result;
      try {
          result = JSON.parse(content);
      } catch (e) {
          console.error('Failed to parse AI JSON', content);
          return { code: "false", description: "שגיאה בפענוח תשובת ה-AI" };
      }

      return { 
          code: result.code || "false", 
          description: result.description || "נוצר ללא תיאור" 
      };

    } catch (error) {
      this.logger.error('AI Error:', error);
      throw new HttpException('AI Error: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
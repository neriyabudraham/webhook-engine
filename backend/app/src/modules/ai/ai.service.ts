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

  async generateFilter(userPrompt: string, sampleData?: any): Promise<{ filter: any; description: string }> {
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
      You are an expert at creating JSON-based filters for a Webhook Filtering Engine.
      Your goal is to convert natural language requirements into a JSON filter object.

      ### Filter Format (MongoDB-like query syntax):
      - Simple equality: { "field.path": "value" }
      - Regex match: { "field.path": { "$regex": "pattern" } }
      - OR conditions: { "$or": [ { "field1": "val1" }, { "field2": "val2" } ] }
      - AND conditions: { "$and": [ { "field1": "val1" }, { "field2": "val2" } ] }

      ### IMPORTANT RULES:
      1. Look at the sample payload structure to find the correct field paths.
      2. Use dot notation for nested fields (e.g., "data.message.text").
      3. For text search in any field, use: { "_fullText": { "$regex": "searchWord" } }
      4. Always return valid JSON filter object.

      ### Output Format:
      Return a JSON object with:
      - "filter": The JSON filter object
      - "description": A short explanation in HEBREW (עברית)

      ### Examples:
      User: "אם ההודעה מכילה את המילה 'בדיקה'"
      Output: { "filter": { "_fullText": { "$regex": "בדיקה" } }, "description": "מחפש את המילה 'בדיקה' בכל תוכן האירוע" }

      User: "רק אם הסטטוס הוא 'paid'"
      Output: { "filter": { "status": "paid" }, "description": "מסנן רק אירועים עם סטטוס paid" }
      
      User: "אם סוג האירוע הוא הודעה או תמונה"
      Output: { "filter": { "$or": [ { "type": "message" }, { "type": "image" } ] }, "description": "מאפשר הודעות טקסט או תמונות" }

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
          filter: result.filter || {},
          description: result.description || "נוצר ללא תיאור" 
      };

    } catch (error) {
      this.logger.error('AI Error:', error);
      throw new HttpException('AI Error: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = require("openai");
let AiService = class AiService {
    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        console.log('--- AI Service Init ---');
        if (!apiKey) {
            console.error('❌ Error: OPENAI_API_KEY is missing!');
        }
        else {
            console.log(`✅ Key loaded. Starts with: ${apiKey.substring(0, 15)}...`);
        }
        this.openai = new openai_1.default({
            apiKey: apiKey || 'missing-key',
        });
    }
    async generateFilter(userPrompt, sampleData) {
        try {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OPENAI_API_KEY is missing in environment variables');
            }
            let contextStr = '';
            if (sampleData) {
                contextStr = `Event data sample: ${JSON.stringify(sampleData).slice(0, 500)}...`;
            }
            const systemPrompt = `

      You are a JavaScript expert for a webhook filter engine.

      Convert description to boolean expression. Context: 'event' (payload, headers, query).

      ${contextStr}

      Return ONLY raw JavaScript boolean expression.

      `;
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                model: 'gpt-4o-mini',
                max_tokens: 300,
                temperature: 0.1,
            });
            let result = completion.choices[0].message.content.trim();
            result = result.replace(/^`+|`+$/g, '').replace(/^javascript/i, '').trim();
            return { code: result };
        }
        catch (error) {
            console.error('AI Error:', error);
            throw new common_1.HttpException('AI Error: ' + error.message, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiService);
//# sourceMappingURL=ai.service.js.map
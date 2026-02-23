import { AiService } from './ai.service';
export declare class AiController {
    private aiService;
    constructor(aiService: AiService);
    generate(body: {
        prompt: string;
        sample: any;
    }): Promise<{
        code: string;
    }>;
}

export declare class AiService {
    private openai;
    constructor();
    generateFilter(userPrompt: string, sampleData?: any): Promise<{
        code: string;
    }>;
}

export declare class MailService {
    private transporter;
    private readonly logger;
    constructor();
    sendVerificationEmail(to: string, token: string): Promise<void>;
    sendResetEmail(to: string, token: string): Promise<void>;
    private sendMail;
    private getHtmlTemplate;
}

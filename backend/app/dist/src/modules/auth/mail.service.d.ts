export declare class MailService {
    private transporter;
    constructor();
    private getTemplate;
    sendVerificationEmail(to: string, token: string): Promise<void>;
    sendResetEmail(to: any, token: any): Promise<void>;
    sendPasswordChangedEmail(to: any): Promise<void>;
}

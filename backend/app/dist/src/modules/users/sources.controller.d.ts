import { PrismaService } from '../../prisma.service';
export declare class SourcesController {
    private prisma;
    constructor(prisma: PrismaService);
    createSource(req: any, body: {
        name: string;
        type?: 'WEBHOOK' | 'EMAIL';
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        active: boolean;
        secret: string | null;
        type: import(".prisma/client").$Enums.SourceType;
        userId: string;
    }>;
    getMySources(req: any): Promise<({
        _count: {
            events: number;
        };
        destinations: ({
            filters: {
                id: string;
                destinationId: string;
                key: string;
                operator: import(".prisma/client").$Enums.FilterType;
                value: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            method: string;
            sourceId: string;
            headers: import("@prisma/client/runtime/library").JsonValue | null;
            url: string;
            rules: import("@prisma/client/runtime/library").JsonValue | null;
            rulesDescription: string | null;
            delay: number;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        active: boolean;
        secret: string | null;
        type: import(".prisma/client").$Enums.SourceType;
        userId: string;
    })[]>;
    getSourceDetails(req: any, id: string): Promise<{
        _count: {
            events: number;
        };
        destinations: ({
            filters: {
                id: string;
                destinationId: string;
                key: string;
                operator: import(".prisma/client").$Enums.FilterType;
                value: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            method: string;
            sourceId: string;
            headers: import("@prisma/client/runtime/library").JsonValue | null;
            url: string;
            rules: import("@prisma/client/runtime/library").JsonValue | null;
            rulesDescription: string | null;
            delay: number;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        active: boolean;
        secret: string | null;
        type: import(".prisma/client").$Enums.SourceType;
        userId: string;
    }>;
    updateSource(req: any, id: string, body: {
        name: string;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        active: boolean;
        secret: string | null;
        type: import(".prisma/client").$Enums.SourceType;
        userId: string;
    }>;
    deleteSource(req: any, id: string): Promise<{
        success: boolean;
    }>;
}

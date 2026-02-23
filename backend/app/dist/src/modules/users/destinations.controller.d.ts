import { PrismaService } from '../../prisma.service';
export declare class DestinationsController {
    private prisma;
    constructor(prisma: PrismaService);
    getMyDestinations(req: any): Promise<({
        source: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            active: boolean;
            secret: string | null;
            type: import(".prisma/client").$Enums.SourceType;
            userId: string;
        };
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
    })[]>;
    getDestDetails(req: any, id: string): Promise<{
        source: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            active: boolean;
            secret: string | null;
            type: import(".prisma/client").$Enums.SourceType;
            userId: string;
        };
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
    }>;
    createDestination(req: any, body: any): Promise<{
        success: boolean;
        id: string;
    }>;
    updateDestination(req: any, id: string, body: any): Promise<{
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
    }>;
    deleteDestination(req: any, id: string): Promise<{
        success: boolean;
    }>;
}

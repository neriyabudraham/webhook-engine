import { PrismaService } from '../../prisma.service';
export declare class EventsController {
    private prisma;
    constructor(prisma: PrismaService);
    getEvents(req: any): Promise<({
        source: {
            name: string;
            slug: string;
        };
        deliveries: {
            createdAt: Date;
            status: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        sourceId: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        headers: import("@prisma/client/runtime/library").JsonValue;
    })[]>;
    getEventDetails(req: any, id: string): Promise<{
        source: {
            name: string;
            slug: string;
        };
        deliveries: ({
            destination: {
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
            };
        } & {
            id: string;
            createdAt: Date;
            destinationId: string;
            eventId: string;
            status: number;
            responseBody: string | null;
            duration: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        sourceId: string;
        payload: import("@prisma/client/runtime/library").JsonValue;
        headers: import("@prisma/client/runtime/library").JsonValue;
    }>;
}

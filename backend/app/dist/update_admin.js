"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'office@neriyabudraham.co.il';
    console.log('Searching for user:', email);
    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: {
                role: 'ADMIN',
                plan: 'ENTERPRISE',
                monthlyLimit: 10000000
            }
        });
        console.log('✅ Success! User updated:', user);
    }
    catch (e) {
        console.error('❌ Error updating user:', e);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=update_admin.js.map
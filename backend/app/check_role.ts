import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'office@neriyabudraham.co.il';
  console.log('--- CHECKING USER ROLE ---');
  
  const user = await prisma.user.findUnique({ where: { email: email } });
  
  if (!user) {
      console.log('❌ User NOT FOUND:', email);
  } else {
      console.log('✅ User Found!');
      console.log('🆔 ID:', user.id);
      console.log('📧 Email:', user.email);
      console.log('👑 Role in DB:', user.role); 
      console.log('📦 Plan:', user.plan);
  }
  console.log('--------------------------');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

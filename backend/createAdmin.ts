import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('taha@1982', 10);
  const email = 'tahakhatip2@gmail.com';
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN'
    },
    create: {
      email,
      username: 'admin_taha',
      firstName: 'Taha',
      lastName: 'Admin',
      passwordHash,
      role: 'ADMIN',
      wallet: { create: { balance: 0, lockedBalance: 0 } }
    }
  });
  console.log('Admin user successfully created/updated:', user.email, 'with role:', user.role);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

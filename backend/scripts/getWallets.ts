import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const wallets = await prisma.wallet.findMany({
    include: { user: true }
  });
  console.dir(wallets, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());

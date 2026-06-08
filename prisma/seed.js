import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@ferrariportas.com.br' },
    update: {},
    create: {
      name: 'Marcelo',
      email: 'admin@ferrariportas.com.br',
      password,
      role: 'ADMIN'
    }
  });

  console.log('Seed concluído — usuário admin criado.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

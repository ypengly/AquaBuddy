import { PrismaClient } from '@prisma/client';
import { ACHIEVEMENTS } from '../src/data/achievements';

const prisma = new PrismaClient();

async function main() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievementDefinition.upsert({
      where: { id: a.id },
      create: { id: a.id, name: a.name, description: a.description, icon: a.icon },
      update: { name: a.name, description: a.description, icon: a.icon },
    });
  }
  console.log(`Seeded ${ACHIEVEMENTS.length} achievement definitions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

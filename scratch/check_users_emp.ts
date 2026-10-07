import { prisma } from "../src/lib/prisma";

async function main() {
  const employees = await prisma.employee.findMany();
  console.log("All Employees in DB:");
  employees.forEach(e => {
    console.log(`- ${e.firstName} ${e.lastName} (${e.email}): id=${e.id}, userId=${e.userId || 'none'}`);
  });
}

main().finally(() => prisma.$disconnect());

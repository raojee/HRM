import { prisma } from "../src/lib/prisma";

async function main() {
  const allocations = await prisma.leaveAllocation.findMany({
    include: { leaveType: true, employee: true }
  });
  console.log("Allocations count:", allocations.length);
  console.log(allocations);
}

main().finally(() => prisma.$disconnect());

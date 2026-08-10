import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getSession();

  if (!session.teacherId) {
    redirect("/login");
  }

  const unitCount = await prisma.unit.count({ where: { teacherId: session.teacherId } });

  if (unitCount === 0) {
    redirect("/welcome");
  }

  redirect("/reports");
}

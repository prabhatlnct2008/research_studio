import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { roles as rolesT, users as usersT } from "@/db/schema";
import { getPageUser, hasCapability } from "@/lib/authz";
import { PageHeader } from "@/components/ui/primitives";
import { RolesAdmin } from "@/components/admin/roles-admin";

export default async function RolesAdminPage() {
  const user = await getPageUser();
  if (!hasCapability(user, "create_roles")) redirect("/");

  const roleRows = await db.select().from(rolesT).orderBy(rolesT.name);
  const counts = await db
    .select({ roleId: usersT.roleId, n: sql<number>`count(*)` })
    .from(usersT)
    .groupBy(usersT.roleId);
  const countMap = new Map(counts.map((c) => [c.roleId, Number(c.n)]));

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Roles" />
      <RolesAdmin
        roles={roleRows.map((r) => ({
          id: r.id,
          name: r.name,
          stageScope: r.stageScope ?? [],
          capabilities: r.capabilities ?? {},
          isBuiltin: r.isBuiltin,
          userCount: countMap.get(r.id) ?? 0,
        }))}
      />
    </div>
  );
}

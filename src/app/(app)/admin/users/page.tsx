import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { roles as rolesT, users as usersT } from "@/db/schema";
import { getPageUser, hasCapability } from "@/lib/authz";
import { PageHeader } from "@/components/ui/primitives";
import { UsersAdmin } from "@/components/admin/users-admin";

export default async function UsersAdminPage() {
  const user = await getPageUser();
  if (!hasCapability(user, "manage_users")) redirect("/");

  const [allUsers, allRoles] = await Promise.all([
    db
      .select({
        id: usersT.id,
        name: usersT.name,
        email: usersT.email,
        roleId: usersT.roleId,
        roleName: rolesT.name,
        status: usersT.status,
      })
      .from(usersT)
      .leftJoin(rolesT, eq(usersT.roleId, rolesT.id))
      .orderBy(usersT.name),
    db.select({ id: rolesT.id, name: rolesT.name }).from(rolesT).orderBy(rolesT.name),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Users" />
      <UsersAdmin
        users={allUsers.map((u) => ({ ...u, isMe: u.id === user.id }))}
        roles={allRoles}
      />
    </div>
  );
}

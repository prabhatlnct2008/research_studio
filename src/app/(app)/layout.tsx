import { redirect } from "next/navigation";
import { getCurrentUser, hasCapability } from "@/lib/authz";
import { getTreeData } from "@/lib/data";
import { getPending } from "@/lib/pending";
import { StudioShell } from "@/components/shell/studio-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const [tree, pending] = await Promise.all([getTreeData(), getPending(user.id)]);

  const nav = {
    manageUsers: hasCapability(user, "manage_users"),
    createRoles: hasCapability(user, "create_roles"),
    createGates: hasCapability(user, "create_gates"),
    createClients: hasCapability(user, "create_clients"),
    createStudies: hasCapability(user, "create_studies"),
  };

  return (
    <StudioShell
      tree={tree}
      pending={pending}
      me={{ id: user.id, name: user.name, email: user.email, roleName: user.role?.name ?? null }}
      nav={nav}
    >
      {children}
    </StudioShell>
  );
}

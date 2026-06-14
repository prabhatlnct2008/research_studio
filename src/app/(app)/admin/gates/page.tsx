import { redirect } from "next/navigation";
import { db } from "@/db";
import { gateTemplateItems } from "@/db/schema";
import { getPageUser, hasCapability } from "@/lib/authz";
import { PageHeader } from "@/components/ui/primitives";
import { GatesAdmin } from "@/components/admin/gates-admin";

export default async function GatesAdminPage() {
  const user = await getPageUser();
  if (!hasCapability(user, "create_gates")) redirect("/");

  const items = await db.select().from(gateTemplateItems).orderBy(gateTemplateItems.order);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Gate templates" />
      <GatesAdmin items={items} />
    </div>
  );
}

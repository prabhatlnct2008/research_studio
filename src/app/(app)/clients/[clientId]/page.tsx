import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { db } from "@/db";
import { clients, contacts as contactsT, studies as studiesT } from "@/db/schema";
import { getPageUser, hasCapability } from "@/lib/authz";
import { studyRisk } from "@/lib/data";
import { STAGES } from "@/lib/constants";
import { PageHeader, Tile, ListRow, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { Pill, RiskPill } from "@/components/ui/pill";
import { NewStudyButton } from "@/components/forms/new-study";
import { AddContactButton } from "@/components/forms/add-contact";

export default async function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await getPageUser();

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (!client) notFound();

  const [studies, contacts] = await Promise.all([
    db.select().from(studiesT).where(eq(studiesT.clientId, clientId)).orderBy(studiesT.name),
    db.select().from(contactsT).where(eq(contactsT.clientId, clientId)),
  ]);

  const withRisk = studies.map((s) => ({ ...s, risk: studyRisk(s) }));
  const atRisk = withRisk.filter((s) => s.risk === "risk").length;
  const watch = withRisk.filter((s) => s.risk === "watch").length;
  const canStudy = hasCapability(user, "create_studies");
  const canEdit = hasCapability(user, "create_clients");

  const statusTone = client.status === "active" ? "green" : client.status === "lead" ? "accent" : "neutral";

  return (
    <div>
      <PageHeader
        eyebrow="Client"
        title={client.name}
        pill={<Pill tone={statusTone}>{client.status}</Pill>}
        action={canStudy ? <NewStudyButton clients={[{ id: client.id, name: client.name }]} presetClientId={client.id} /> : undefined}
      />

      <p className="mb-6 text-meta text-muted">
        {[client.sector, client.location].filter(Boolean).join(" · ") || "No sector or location set."}
      </p>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <Tile value={studies.length} label="Studies" />
        <Tile value={atRisk} label="At risk" bar="red" />
        <Tile value={watch} label="To watch" bar="amber" />
      </div>

      <SectionTitle>Studies</SectionTitle>
      {withRisk.length === 0 ? (
        <EmptyState
          title="No studies under this client"
          hint="Create a study to begin its journey through the nine stages."
          action={canStudy ? <NewStudyButton clients={[{ id: client.id, name: client.name }]} presetClientId={client.id} /> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {withRisk.map((s) => (
            <ListRow
              key={s.id}
              href={`/studies/${s.id}`}
              icon={<FlaskConical size={18} />}
              title={s.name}
              meta={`Current stage: ${STAGES[s.currentStage]}${s.status !== "active" ? ` · ${s.status}` : ""}`}
              right={s.status === "active" ? <RiskPill risk={s.risk} /> : <Pill tone="neutral">{s.status}</Pill>}
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle>Contacts</SectionTitle>
          {canEdit && <AddContactButton clientId={client.id} />}
        </div>
        {contacts.length === 0 ? (
          <EmptyState title="No contacts yet" hint="Add a contact so emails and approvals attribute to a person." />
        ) : (
          <div className="flex flex-col gap-2">
            {contacts.map((c) => (
              <ListRow
                key={c.id}
                title={c.name}
                meta={c.email}
                right={c.isPrimary ? <Pill tone="accent">Primary</Pill> : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

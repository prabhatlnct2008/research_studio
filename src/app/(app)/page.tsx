import Link from "next/link";
import { Building2 } from "lucide-react";
import { getPageUser, hasCapability } from "@/lib/authz";
import { getTreeData } from "@/lib/data";
import { getPending } from "@/lib/pending";
import { PageHeader, Tile, ListRow, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { NewClientButton } from "@/components/forms/new-client";
import { NewStudyButton } from "@/components/forms/new-study";

export default async function WorkspacePage() {
  const user = await getPageUser();
  const tree = await getTreeData();
  const pending = await getPending(user.id);

  const allStudies = tree.flatMap((c) => c.studies);
  const atRisk = allStudies.filter((s) => s.risk === "risk").length;
  const watch = allStudies.filter((s) => s.risk === "watch").length;
  const activeStudies = allStudies.filter((s) => s.status === "active").length;

  const canClient = hasCapability(user, "create_clients");
  const canStudy = hasCapability(user, "create_studies");

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Home"
        action={
          <div className="flex gap-2">
            {canStudy && tree.length > 0 && (
              <NewStudyButton clients={tree.map((c) => ({ id: c.id, name: c.name }))} />
            )}
            {canClient && <NewClientButton />}
          </div>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile value={tree.length} label="Clients" />
        <Tile value={activeStudies} label="Active studies" bar="accent" />
        <Tile value={watch} label="To watch" bar="amber" />
        <Tile value={atRisk} label="At risk" bar="red" />
      </div>

      {pending.items.length > 0 && (
        <div className="mb-8 rounded-card border border-accent/30 bg-accent-soft/50 px-4 py-3">
          <p className="text-meta text-ink">
            <span className="font-semibold">{pending.items.length}</span>{" "}
            {pending.items.length === 1 ? "item is" : "items are"} waiting on you — see the For-you list on the left.
          </p>
        </div>
      )}

      <SectionTitle>Clients</SectionTitle>
      {tree.length === 0 ? (
        <EmptyState
          title="No clients yet"
          hint="Create your first client to start filing studies."
          action={canClient ? <NewClientButton /> : undefined}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {tree.map((c) => {
            const cRisk = c.studies.filter((s) => s.risk === "risk").length;
            const cStudies = c.studies.length;
            return (
              <ListRow
                key={c.id}
                href={`/clients/${c.id}`}
                icon={<Building2 size={18} />}
                title={c.name}
                meta={`${cStudies} ${cStudies === 1 ? "study" : "studies"}`}
                right={
                  cRisk > 0 ? (
                    <span className="text-meta font-medium text-red">{cRisk} at risk</span>
                  ) : (
                    <span className="text-meta text-green">On track</span>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

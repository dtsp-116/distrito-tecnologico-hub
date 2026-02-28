import { AgencyPage } from "@/features/agencia/AgencyPage";
import { getHubData } from "@/lib/data/hubRepository";

interface AgencyRouteProps {
  params: Promise<{
    agencyId: string;
  }>;
}

export default async function Page({ params }: AgencyRouteProps) {
  const resolvedParams = await params;
  const hubData = await getHubData();
  return (
    <AgencyPage
      agencyId={resolvedParams.agencyId}
      agencias={hubData.agencias}
      editais={hubData.editais}
      topicos={hubData.topicos}
    />
  );
}

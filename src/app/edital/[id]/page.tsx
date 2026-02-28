import { EditalPage } from "@/features/edital/EditalPage";
import { getHubData } from "@/lib/data/hubRepository";

interface EditalRouteProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function Page({ params }: EditalRouteProps) {
  const resolvedParams = await params;
  const hubData = await getHubData();
  return (
    <EditalPage
      editalId={resolvedParams.id}
      agencias={hubData.agencias}
      editais={hubData.editais}
      topicos={hubData.topicos}
    />
  );
}

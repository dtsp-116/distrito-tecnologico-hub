import { getHubData } from "@/lib/data/hubRepository";
import { EditorPage } from "@/features/editor/EditorPage";

export default async function Page() {
  const hubData = await getHubData();
  return <EditorPage agencias={hubData.agencias} />;
}


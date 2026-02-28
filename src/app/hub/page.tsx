import { HomePage } from "@/features/home/HomePage";
import { getHubData } from "@/lib/data/hubRepository";

export default async function Page() {
  const hubData = await getHubData();
  return <HomePage agencias={hubData.agencias} editais={hubData.editais} topicos={hubData.topicos} />;
}

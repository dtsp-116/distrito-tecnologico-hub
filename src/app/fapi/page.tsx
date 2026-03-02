import { FapiPage } from "@/features/fapi/FapiPage";
import { getHubData } from "@/lib/data/hubRepository";

export default async function Page() {
  const hubData = await getHubData();
  return <FapiPage agencias={hubData.agencias} />;
}

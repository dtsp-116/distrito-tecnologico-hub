import { FapiRulesPage } from "@/features/admin/fapi-rules/FapiRulesPage";
import { getHubData } from "@/lib/data/hubRepository";

export default async function Page() {
  const hubData = await getHubData();
  return <FapiRulesPage agencias={hubData.agencias} editais={hubData.editais} />;
}

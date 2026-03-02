import { purgeExpiredFapiSessions } from "@/modules/fapi/services/sessionStore";

export async function withFapiSessionCleanup<T>(handler: () => Promise<T>) {
  purgeExpiredFapiSessions();
  try {
    return await handler();
  } finally {
    purgeExpiredFapiSessions();
  }
}

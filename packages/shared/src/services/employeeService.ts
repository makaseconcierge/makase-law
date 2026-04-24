import { getDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["employeeService"]);

export async function get(office_id: string, user_id: string) {
  logger.trace("Getting employee", { office_id, user_id });
  return getDb()
    .selectFrom("employees")
    .selectAll()
    .where("office_id", "=", office_id)
    .where("user_id", "=", user_id)
    .executeTakeFirst();
}

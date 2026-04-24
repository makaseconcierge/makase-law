import { getDb } from "../db/dbClient";
import { getLogger } from "@logtape/logtape";

let logger = getLogger(["userService"]);

export async function listOffices(user_id: string) {
  logger.trace("Listing offices", { user_id });
  return getDb()
    .selectFrom("employees")
    .where("employees.user_id", "=", user_id)
    .innerJoin("offices", "employees.office_id", "offices.office_id")
    .selectAll("employees")
    .select(["name", "logo", "role_config"])
    .execute();
}

export async function getProfile(user_id: string) {
  logger.trace("Getting profile", { user_id });
  return getDb()
    .selectFrom("user_profiles")
    .selectAll()
    .where("user_id", "=", user_id)
    .executeTakeFirst();
}

export async function getWithOffices(user_id: string) {
  logger.trace("Getting profile with offices", { user_id });
  const [user, offices] = await Promise.all([
    getProfile(user_id),
    listOffices(user_id),
  ]);
  return { ...user, offices };
}

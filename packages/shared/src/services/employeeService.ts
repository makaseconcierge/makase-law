import { getDb } from "../dbClient";

export async function get(office_id: string, user_id: string) {
  return getDb()
    .selectFrom("employees")
    .selectAll()
    .where("office_id", "=", office_id)
    .where("user_id", "=", user_id)
    .executeTakeFirst();
}

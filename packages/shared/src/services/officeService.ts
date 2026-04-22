import type { OfficePatch } from "@makase-law/types";
import { getDb } from "../dbClient";

export async function get(office_id: string) {
  return getDb()
    .selectFrom("offices")
    .selectAll()
    .where("office_id", "=", office_id)
    .executeTakeFirst();
}

export async function update(office_id: string, data: OfficePatch) {
  return getDb()
    .updateTable("offices")
    .where("office_id", "=", office_id)
    .set(data)
    .returningAll()
    .executeTakeFirst();
}

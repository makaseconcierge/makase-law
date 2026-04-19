import type { Matter } from "@makase-law/types";
import { getDb } from "../dbClient";

export async function create(office_id: string, data: Matter) {
  return getDb()
    .insertInto("matters")
    .values({ ...data, office_id })
    .returningAll()
    .executeTakeFirst();
}

export async function get(office_id: string, matter_id: string) {
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where("office_id", "=", office_id)
    .where("matter_id", "=", matter_id)
    .executeTakeFirst();
}

export async function update(
  office_id: string,
  matter_id: string,
  data: Partial<Matter>,
) {
  return getDb()
    .updateTable("matters")
    .where("office_id", "=", office_id)
    .where("matter_id", "=", matter_id)
    .set(data)
    .returningAll()
    .executeTakeFirst();
}

export async function list(office_id: string) {
  return getDb()
    .selectFrom("matters")
    .selectAll()
    .where("office_id", "=", office_id)
    .execute();
}

import { getDb } from "../dbClient";

export async function listOffices(user_id: string) {
  return getDb()
    .selectFrom("employees")
    .where("employees.user_id", "=", user_id)
    .innerJoin("offices", "employees.office_id", "offices.office_id")
    .selectAll("employees")
    .select(["name", "logo", "role_config"])
    .execute();
}

export async function getProfile(user_id: string) {
  return getDb()
    .selectFrom("user_profiles")
    .selectAll()
    .where("user_id", "=", user_id)
    .executeTakeFirst();
}

export async function getWithOffices(user_id: string) {
  const [user, offices] = await Promise.all([
    getProfile(user_id),
    listOffices(user_id),
  ]);
  return { ...user, offices };
}

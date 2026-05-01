import { getLogger } from "@logtape/logtape";
import { getEmployeeContext } from "../../context/logged-in-context";

const logger = getLogger(["teamsService"]);

export async function listAll() {
  const { db, loggedInOfficeId } = getEmployeeContext();
  logger.trace("Listing teams");
  return db.selectFrom("teams")
    .selectAll()
    .where("office_id", "=", loggedInOfficeId)
    .execute();
}

export async function listMine() {
  const { db, loggedInOfficeId , teamIds} = getEmployeeContext();
  logger.trace("Listing teams");
  return db.selectFrom("teams")
    .selectAll()
    .where("office_id", "=", loggedInOfficeId)
    .where("team_id", "in", teamIds)
    .execute();
}

export async function listMembers(team_id: string) {
  const { db, teamIds, loggedInOfficeId } = getEmployeeContext();
  if (!teamIds.includes(team_id)) throw { status: 403, message: "Unauthorized" };
  logger.trace("Listing team members", { team_id });
  return db.selectFrom("employee_teams")
    .selectAll()
    .where("office_id", "=", loggedInOfficeId)
    .where("team_id", "=", team_id)
    .execute();
}

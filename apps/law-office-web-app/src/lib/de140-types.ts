export interface DE140FormData {
  // ── Attorney / header ──
  attorney_info: string;
  telephone: string;
  email: string;

  // ── Court ──
  county: string;
  court_street: string;
  court_mailing: string;
  court_city_zip: string;
  branch_name: string;
  estate_name: string;
  case_number: string;

  // ── Title checkboxes ──
  title_executor: boolean;
  title_admin_will_annexed: boolean;
  title_administrator: boolean;
  title_special_admin: boolean;
  title_independent_admin: boolean;
  title_full_authority: boolean;
  title_limited_authority: boolean;

  // ── 1. Court Finds ──
  notices_given: boolean;
  death_date: string;
  residence_type: string; // "resident" | "nonresident"
  died_intestate: boolean;
  will_date: string;
  codicil_date: string;
  minute_order_date: string;

  // ── 2. Court Orders – appointment ──
  representative_name: string;
  appoint_executor: boolean;
  appoint_admin_will_annexed: boolean;
  appoint_administrator: boolean;
  appoint_special_admin: boolean;
  special_admin_general_powers: boolean;
  special_admin_special_powers: boolean;
  special_admin_without_notice: boolean;
  letters_expire_date: string;

  // ── 3. Hearing ──
  hearing_date: string;
  hearing_time: string;
  hearing_dept: string;
  hearing_room_judge: string;

  // ── 4. Independent administration ──
  full_authority: boolean;
  limited_authority: boolean;

  // ── 5. Bond ──
  bond_not_required: boolean;
  bond_amount: string;
  deposit_amount: string;
  deposit_institution: string;
  not_authorized_without_order: boolean;

  // ── 6. Probate referee ──
  probate_referee_name: string;

  // ── 7. Pages / signature ──
  number_of_pages_attached: string;
  order_date: string;
}

export interface ClientDE140FormData {
  estate_name: string;

  // Section 1
  death_date: string;
  residence_type: string;
  died_intestate: boolean;
  will_date: string;
  codicil_date: string;

  // Section 2
  representative_name: string;
  appointment_type: string; // "executor" | "admin_will_annexed" | "administrator" | "special_admin"
  special_admin_general_powers: boolean;

  // Section 4
  authority_type: string; // "full" | "limited" | "none"

  // Section 5
  bond_not_required: boolean;
  bond_amount: string;
  deposit_amount: string;
  deposit_institution: string;
  not_authorized_without_order: boolean;

  // Section 6
  probate_referee_name: string;

  number_of_pages_attached: string;
}

export function createEmptyDE140ClientData(): ClientDE140FormData {
  return {
    estate_name: "",
    death_date: "",
    residence_type: "resident",
    died_intestate: false,
    will_date: "",
    codicil_date: "",
    representative_name: "",
    appointment_type: "executor",
    special_admin_general_powers: false,
    authority_type: "full",
    bond_not_required: true,
    bond_amount: "",
    deposit_amount: "",
    deposit_institution: "",
    not_authorized_without_order: false,
    probate_referee_name: "",
    number_of_pages_attached: "",
  };
}

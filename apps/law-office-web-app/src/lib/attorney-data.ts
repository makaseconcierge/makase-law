import type { DE111FormData } from "./types";

export interface AttorneyProfile {
  attorney_name: string;
  state_bar_no: string;
  firm_name: string;
  attorney_street: string;
  attorney_city: string;
  attorney_state: string;
  attorney_zip: string;
  telephone: string;
  fax: string;
  email: string;
  attorney_print_name: string;
}

export interface CaseSetup {
  county: string;
  court_street: string;
  court_mailing: string;
  court_city_zip: string;
  branch_name: string;
  case_number: string;
  hearing_date: string;
  hearing_time: string;
  dept: string;
  petition_probate_will: boolean;
  petition_probate_lost_will: boolean;
  petition_letters_admin: boolean;
  petition_letters_special_admin: boolean;
  petition_independent_admin: boolean;
  petition_lost_will_admin: boolean;
  appointee_role: string;
  special_admin_general_powers: boolean;
  authority_type: string;
  bond_not_required: boolean;
  bond_fixed: boolean;
  bond_amount: string;
  blocked_account: boolean;
  blocked_account_amount: string;
  blocked_account_institution: string;
  independent_admin: boolean;
  will_waives_bond: boolean;
  special_admin_waives_bond: boolean;
  beneficiaries_waived: boolean;
  heirs_waived: boolean;
  corporate_fiduciary: boolean;
  executor_named_in_will: boolean;
  no_executor_named: boolean;
  nominee_of_person: boolean;
  other_executors_not_act_death: boolean;
  other_executors_not_act_declination: boolean;
  other_executors_not_act_other: boolean;
  other_executors_other_reasons: string;
  petitioner_entitled_to_letters: boolean;
  petitioner_nominee: boolean;
  special_admin_requested: boolean;
  representative_resident_ca: boolean;
  representative_nonresident_ca: boolean;
  representative_nonresident_ca_address: string;
  representative_resident_us: boolean;
  representative_nonresident_us: boolean;
  successor_representative: boolean;
  will_does_not_preclude: boolean;
  publication_type: string;
  newspaper_name: string;
}

// Mock attorney profile — would come from the database in production
export const MOCK_ATTORNEY: AttorneyProfile = {
  attorney_name: "Jane Doe, Esq.",
  state_bar_no: "123456",
  firm_name: "Doe & Test LLP",
  attorney_street: "100 Test Street, Suite 1",
  attorney_city: "Testville",
  attorney_state: "CA",
  attorney_zip: "90000",
  telephone: "(555) 000-0000",
  fax: "(555) 000-0001",
  email: "jane@doetest.example",
  attorney_print_name: "Jane Doe",
};

// Mock case setup — attorney configures this per-case before sending to client
export const MOCK_CASE_SETUP: CaseSetup = {
  county: "Test County",
  court_street: "1 Court Plaza",
  court_mailing: "PO Box 0000",
  court_city_zip: "Testville, CA 90000",
  branch_name: "Test Branch Courthouse",
  case_number: "",
  hearing_date: "",
  hearing_time: "",
  dept: "",
  petition_probate_will: true,
  petition_probate_lost_will: false,
  petition_letters_admin: false,
  petition_letters_special_admin: false,
  petition_independent_admin: true,
  petition_lost_will_admin: false,
  appointee_role: "executor",
  special_admin_general_powers: false,
  authority_type: "full",
  bond_not_required: true,
  bond_fixed: false,
  bond_amount: "",
  blocked_account: false,
  blocked_account_amount: "",
  blocked_account_institution: "",
  independent_admin: true,
  will_waives_bond: true,
  special_admin_waives_bond: false,
  beneficiaries_waived: false,
  heirs_waived: false,
  corporate_fiduciary: false,
  executor_named_in_will: true,
  no_executor_named: false,
  nominee_of_person: false,
  other_executors_not_act_death: false,
  other_executors_not_act_declination: false,
  other_executors_not_act_other: false,
  other_executors_other_reasons: "",
  petitioner_entitled_to_letters: false,
  petitioner_nominee: false,
  special_admin_requested: false,
  representative_resident_ca: true,
  representative_nonresident_ca: false,
  representative_nonresident_ca_address: "",
  representative_resident_us: true,
  representative_nonresident_us: false,
  successor_representative: false,
  will_does_not_preclude: true,
  publication_type: "requested",
  newspaper_name: "Los Angeles Daily Journal",
};

/**
 * Merge attorney profile + case setup into the full DE111 form data shape,
 * combined with client-provided fields.
 */
export function mergeAttorneyData(
  attorney: AttorneyProfile,
  caseSetup: CaseSetup,
  clientData: Partial<DE111FormData>
): DE111FormData {
  return {
    // Attorney fields
    ...attorney,
    attorney_for: clientData.petitioner_names?.split("\n")[0]?.trim() || "",

    // Case setup fields
    ...caseSetup,

    // Client fields (with defaults)
    estate_name: "",
    petitioner_names: "",
    admit_will: caseSetup.petition_probate_will,
    appointee_name: "",
    death_date: "",
    death_place: "",
    residence_type: "resident",
    nonresident_location: "",
    decedent_address: "",
    foreign_citizen: false,
    foreign_country: "",
    personal_property: "",
    annual_income_real: "",
    annual_income_personal: "",
    gross_fmv_real: "",
    encumbrances: "",
    died_intestate: false,
    will_date: "",
    codicil_date: "",
    self_proving: false,
    lost_will: false,
    petitioner_relationship: "",
    survived_by_spouse: false,
    survived_by_no_spouse: false,
    no_spouse_reason: "",
    survived_by_domestic_partner: false,
    survived_by_no_domestic_partner: false,
    survived_by_child: false,
    child_type: "",
    survived_by_no_child: false,
    survived_by_issue_of_predeceased: false,
    survived_by_no_issue_of_predeceased: false,
    stepchild_survived: "",
    survived_by_parents: false,
    survived_by_issue_of_parents: false,
    survived_by_grandparents: false,
    survived_by_issue_of_grandparents: false,
    survived_by_issue_of_pre_dec_spouse: false,
    survived_by_next_of_kin: false,
    survived_by_parents_of_pre_dec_spouse: false,
    survived_by_no_known_next_of_kin: false,
    no_pre_dec_spouse: false,
    pre_dec_spouse_real_property: false,
    pre_dec_spouse_personal_property: false,
    pre_dec_neither_apply: false,
    pre_dec_survived_by_issue: false,
    pre_dec_survived_by_parents: false,
    pre_dec_survived_by_issue_of_parent: false,
    pre_dec_survived_by_next_of_kin_decedent: false,
    pre_dec_survived_by_next_of_kin_pre_dec: false,
    persons: [{ name: "", relationship: "", age: "", address: "" }],
    continued_on_attachment_8: false,
    number_of_pages_attached: "",
    signature_date: "",
    petitioner_1_print_name: "",
    petitioner_2_print_name: "",
    additional_petitioners_on_attachment: false,

    // Client overrides on top
    ...clientData,
  };
}

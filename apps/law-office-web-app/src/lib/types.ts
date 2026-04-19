export interface PersonEntry {
  name: string;
  relationship: string;
  age: string;
  address: string;
}

export interface DE111FormData {
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
  attorney_for: string;

  county: string;
  court_street: string;
  court_mailing: string;
  court_city_zip: string;
  branch_name: string;

  estate_name: string;
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

  petitioner_names: string;
  publication_type: string;
  newspaper_name: string;

  death_date: string;
  death_place: string;
  residence_type: string;
  nonresident_location: string;
  decedent_address: string;
  foreign_citizen: boolean;
  foreign_country: string;

  admit_will: boolean;

  appointee_name: string;
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

  personal_property: string;
  annual_income_real: string;
  annual_income_personal: string;
  gross_fmv_real: string;
  encumbrances: string;

  will_waives_bond: boolean;
  special_admin_waives_bond: boolean;
  beneficiaries_waived: boolean;
  heirs_waived: boolean;
  corporate_fiduciary: boolean;

  died_intestate: boolean;
  will_date: string;
  codicil_date: string;
  self_proving: boolean;
  lost_will: boolean;

  executor_named_in_will: boolean;
  no_executor_named: boolean;
  nominee_of_person: boolean;
  other_executors_not_act_death: boolean;
  other_executors_not_act_declination: boolean;
  other_executors_not_act_other: boolean;
  other_executors_other_reasons: string;

  petitioner_entitled_to_letters: boolean;
  petitioner_nominee: boolean;
  petitioner_relationship: string;

  special_admin_requested: boolean;

  representative_resident_ca: boolean;
  representative_nonresident_ca: boolean;
  representative_nonresident_ca_address: string;
  representative_resident_us: boolean;
  representative_nonresident_us: boolean;
  successor_representative: boolean;

  survived_by_spouse: boolean;
  survived_by_no_spouse: boolean;
  no_spouse_reason: string;
  survived_by_domestic_partner: boolean;
  survived_by_no_domestic_partner: boolean;
  survived_by_child: boolean;
  child_type: string;
  survived_by_no_child: boolean;
  survived_by_issue_of_predeceased: boolean;
  survived_by_no_issue_of_predeceased: boolean;
  stepchild_survived: string;

  will_does_not_preclude: boolean;

  survived_by_parents: boolean;
  survived_by_issue_of_parents: boolean;
  survived_by_grandparents: boolean;
  survived_by_issue_of_grandparents: boolean;
  survived_by_issue_of_pre_dec_spouse: boolean;
  survived_by_next_of_kin: boolean;
  survived_by_parents_of_pre_dec_spouse: boolean;
  survived_by_no_known_next_of_kin: boolean;

  no_pre_dec_spouse: boolean;
  pre_dec_spouse_real_property: boolean;
  pre_dec_spouse_personal_property: boolean;
  pre_dec_neither_apply: boolean;
  pre_dec_survived_by_issue: boolean;
  pre_dec_survived_by_parents: boolean;
  pre_dec_survived_by_issue_of_parent: boolean;
  pre_dec_survived_by_next_of_kin_decedent: boolean;
  pre_dec_survived_by_next_of_kin_pre_dec: boolean;

  persons: PersonEntry[];
  continued_on_attachment_8: boolean;

  number_of_pages_attached: string;
  signature_date: string;
  attorney_print_name: string;
  petitioner_1_print_name: string;
  petitioner_2_print_name: string;
  additional_petitioners_on_attachment: boolean;
}

export interface ClientFormData {
  estate_name: string;
  petitioner_names: string;
  appointee_name: string;
  petitioner_relationship: string;
  special_admin_general_powers: boolean;

  death_date: string;
  death_place: string;
  residence_type: string;
  nonresident_location: string;
  decedent_address: string;
  foreign_citizen: boolean;
  foreign_country: string;

  personal_property: string;
  annual_income_real: string;
  annual_income_personal: string;
  gross_fmv_real: string;
  encumbrances: string;

  died_intestate: boolean;
  will_date: string;
  codicil_date: string;
  self_proving: boolean;
  lost_will: boolean;

  survived_by_spouse: boolean;
  survived_by_no_spouse: boolean;
  no_spouse_reason: string;
  survived_by_domestic_partner: boolean;
  survived_by_no_domestic_partner: boolean;
  survived_by_child: boolean;
  child_type: string;
  survived_by_no_child: boolean;
  survived_by_issue_of_predeceased: boolean;
  survived_by_no_issue_of_predeceased: boolean;
  stepchild_survived: string;

  survived_by_parents: boolean;
  survived_by_issue_of_parents: boolean;
  survived_by_grandparents: boolean;
  survived_by_issue_of_grandparents: boolean;
  survived_by_issue_of_pre_dec_spouse: boolean;
  survived_by_next_of_kin: boolean;
  survived_by_parents_of_pre_dec_spouse: boolean;
  survived_by_no_known_next_of_kin: boolean;

  no_pre_dec_spouse: boolean;
  pre_dec_spouse_real_property: boolean;
  pre_dec_spouse_personal_property: boolean;
  pre_dec_neither_apply: boolean;
  pre_dec_survived_by_issue: boolean;
  pre_dec_survived_by_parents: boolean;
  pre_dec_survived_by_issue_of_parent: boolean;
  pre_dec_survived_by_next_of_kin_decedent: boolean;
  pre_dec_survived_by_next_of_kin_pre_dec: boolean;

  persons: PersonEntry[];
  continued_on_attachment_8: boolean;

  number_of_pages_attached: string;
  signature_date: string;
  petitioner_1_print_name: string;
  petitioner_2_print_name: string;
  additional_petitioners_on_attachment: boolean;
}

export function createEmptyClientData(): ClientFormData {
  return {
    estate_name: "",
    petitioner_names: "",
    appointee_name: "",
    petitioner_relationship: "",
    special_admin_general_powers: false,
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
  };
}

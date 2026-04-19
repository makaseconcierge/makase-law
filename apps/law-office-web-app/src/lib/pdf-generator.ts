import { PDFDocument } from "pdf-lib";
import type { DE111FormData } from "@/lib/types";

function num(s: string): number {
  const n = Number(String(s).replace(/[$,]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function dollars(n: number): string {
  if (n === 0) return "";
  return n.toLocaleString("en-US");
}

function safe(field: { setText: (v: string) => void }, value: string) {
  try {
    if (value) field.setText(value);
  } catch {
    /* field may not support setText */
  }
}

function check(
  field: { check: () => void; uncheck: () => void },
  value: boolean
) {
  try {
    if (value) field.check();
    else field.uncheck();
  } catch {
    /* field may not support check */
  }
}

export async function generateDE111PDF(
  data: DE111FormData
): Promise<Uint8Array> {
  const pdfBytes = await fetch("/de111.pdf").then((r) => r.arrayBuffer());
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();

  const F = (name: string) => {
    try {
      return form.getTextField(name);
    } catch {
      return null;
    }
  };
  const C = (name: string) => {
    try {
      return form.getCheckBox(name);
    } catch {
      return null;
    }
  };

  // ── Page 1 Header: Attorney ──
  const a = "topmostSubform[0].Page1[0].StdP1Header_sf[0].AttyInfo[0]";
  safe(F(`${a}.AttyName_ft[0]`)!, data.attorney_name);
  safe(F(`${a}.AttyBarNo_dc[0]`)!, data.state_bar_no);
  safe(F(`${a}.AttyFirm_ft[0]`)!, data.firm_name);
  safe(F(`${a}.AttyStreet_ft[0]`)!, data.attorney_street);
  safe(F(`${a}.AttyCity_ft[0]`)!, data.attorney_city);
  safe(F(`${a}.AttyState_ft[0]`)!, data.attorney_state);
  safe(F(`${a}.AttyZip_ft[0]`)!, data.attorney_zip);
  safe(F(`${a}.Phone_ft[0]`)!, data.telephone);
  safe(F(`${a}.Fax_ft[0]`)!, data.fax);
  safe(F(`${a}.Email_ft[0]`)!, data.email);
  safe(F(`${a}.AttyFor_ft[0]`)!, data.attorney_for);

  // ── Page 1 Header: Court ──
  const c = "topmostSubform[0].Page1[0].StdP1Header_sf[0].CourtInfo[0]";
  safe(F(`${c}.CrtCounty_ft[0]`)!, data.county);
  safe(F(`${c}.Street_ft[0]`)!, data.court_street);
  safe(F(`${c}.MailingAdd_ft[0]`)!, data.court_mailing);
  safe(F(`${c}.CityZip_ft[0]`)!, data.court_city_zip);
  safe(F(`${c}.Branch_ft[0]`)!, data.branch_name);

  // ── Page 1 Header: Case caption (repeated on all pages) ──
  const captions = [
    "topmostSubform[0].Page1[0].StdP1Header_sf[0]",
    "topmostSubform[0].Page2[0].Page2[0].CaptionPx_sf[0]",
    "topmostSubform[0].Page3[0].PxCaption[0]",
    "topmostSubform[0].Page4[0].CaptionPx_sf[0]",
  ];
  for (const prefix of captions) {
    const party = F(`${prefix}.TitlePartyName[0].Party1[0]`);
    const caseNo = F(`${prefix}.CaseNumber[0].CaseNumber[0]`);
    if (party) safe(party, data.estate_name);
    if (caseNo) safe(caseNo, data.case_number);
  }

  // ── Page 1 Header: Petition type checkboxes ──
  const ft = "topmostSubform[0].Page1[0].StdP1Header_sf[0].FormTitle[0]";
  // Row 1: Probate of Will and for Letters Testamentary
  check(C(`${ft}.CheckBox23[0]`)!, data.petition_probate_will);
  // Row 1 right: "Lost" modifier → Probate of Lost Will
  check(C(`${ft}.CheckBox23[1]`)!, data.petition_probate_lost_will);
  // Row 2: Probate of Lost Will and for Letters of Administration with Will Annexed
  check(C(`${ft}.CheckBox22[0]`)!, data.petition_lost_will_admin);
  // Row 2 right: "Lost" modifier
  check(C(`${ft}.CheckBox23[2]`)!, data.petition_lost_will_admin);
  // Letters of Administration
  check(C(`${ft}.CheckBox21[0]`)!, data.petition_letters_admin);
  // Letters of Special Administration
  check(C(`${ft}.CheckBox20[0]`)!, data.petition_letters_special_admin);
  // with general powers
  check(C(`${ft}.CheckBox17[0]`)!, data.special_admin_general_powers);
  // Authorization to Administer Under the IAEA
  check(C(`${ft}.CheckBox19[0]`)!, data.petition_independent_admin);
  // with limited authority
  check(
    C(`${ft}.CheckBox18[0]`)!,
    data.petition_independent_admin && data.authority_type === "limited"
  );

  // ── Page 1 Header: Hearing ──
  const h = "topmostSubform[0].Page1[0].StdP1Header_sf[0].CaseNumber[1]";
  const hearingText = [data.hearing_date, data.hearing_time]
    .filter(Boolean)
    .join(" ");
  safe(F(`${h}.CaseNumber_ft[0]`)!, hearingText);
  safe(F(`${h}.FillText121[0]`)!, data.dept);

  // ── Page 1 Body: Item 1 – Petitioner & Publication ──
  const p1 = "topmostSubform[0].Page1[0]";
  safe(F(`${p1}.FillText142[0]`)!, data.petitioner_names);
  safe(F(`${p1}.FillText141[0]`)!, data.newspaper_name);
  check(C(`${p1}.CheckBox1[0]`)!, data.publication_type === "requested");
  check(C(`${p1}.CheckBox1[1]`)!, data.publication_type === "arranged");

  // ── Page 1 Body: Item 2/3 – Requests ──
  check(C(`${p1}.CheckBox3[0]`)!, data.admit_will);
  safe(F(`${p1}.FillText143[0]`)!, data.appointee_name);
  const role = data.petitioner_relationship || data.appointee_role;
  check(C(`${p1}.CheckBox5[0]`)!, role === "executor");
  check(C(`${p1}.CheckBox6[0]`)!, role === "adminWillAnnexed");
  check(C(`${p1}.CheckBox7[0]`)!, role === "administrator");
  check(C(`${p1}.CheckBox8[0]`)!, role === "specialAdmin");
  check(
    C(`${p1}.CheckBox9[0]`)!,
    role === "specialAdmin" && data.special_admin_general_powers
  );
  // full / limited authority
  check(C(`${p1}.CheckBox12[0]`)!, data.authority_type === "full");
  check(C(`${p1}.CheckBox12[1]`)!, data.authority_type === "limited");
  // bond
  check(C(`${p1}.CheckBox11[0]`)!, data.bond_not_required);
  check(C(`${p1}.CheckBox13[0]`)!, data.bond_fixed);
  if (data.bond_fixed) safe(F(`${p1}.FillText144[0]`)!, data.bond_amount);
  check(C(`${p1}.CheckBox14[0]`)!, data.blocked_account);
  if (data.blocked_account) {
    safe(F(`${p1}.FillText145[0]`)!, data.blocked_account_amount);
    safe(F(`${p1}.FillText161[0]`)!, data.blocked_account_institution);
  }
  // independent admin
  check(C(`${p1}.CheckBox81[0]`)!, data.independent_admin);

  // ── Page 1 Body: Item 2 – Decedent info ──
  safe(F(`${p1}.FillText146[0]`)!, data.death_date);
  safe(F(`${p1}.FillText147[0]`)!, data.death_place);
  check(C(`${p1}.CheckBox15[0]`)!, data.residence_type === "resident");
  check(C(`${p1}.CheckBox15[1]`)!, data.residence_type === "nonresident");
  safe(F(`${p1}.FillText148[0]`)!, data.decedent_address);
  safe(
    F(`${p1}.FillText149[0]`)!,
    data.residence_type === "nonresident" ? data.nonresident_location : ""
  );
  // foreign citizen
  safe(F(`${p1}.TextField3g5[0]`)!, data.foreign_country);

  // ── Page 2: Item 3d – Estate values ──
  const p2 = "topmostSubform[0].Page2[0].Page2[0]";
  const personal = num(data.personal_property);
  const incReal = num(data.annual_income_real);
  const incPersonal = num(data.annual_income_personal);
  const grossReal = num(data.gross_fmv_real);
  const enc = num(data.encumbrances);
  const subtotal = personal + incReal + incPersonal;
  const netReal = grossReal - enc;
  const total = subtotal + netReal;

  safe(F(`${p2}.FillText162[0]`)!, dollars(personal)); // (1) personal property
  safe(F(`${p2}.FillText165[0]`)!, dollars(incReal)); // (2)(a) income real
  safe(F(`${p2}.FillText164[0]`)!, dollars(incPersonal)); // (2)(b) income personal
  safe(F(`${p2}.FillText163[0]`)!, dollars(subtotal)); // (3) subtotal
  safe(F(`${p2}.FillText173[0]`)!, dollars(grossReal)); // (4) gross FMV real
  safe(F(`${p2}.FillText173[1]`)!, dollars(enc)); // (5) encumbrances
  safe(F(`${p2}.FillText178[0]`)!, dollars(netReal)); // (6) net value real
  safe(F(`${p2}.FillText177[0]`)!, dollars(total)); // (7) total

  // ── Page 2: Item 3e – Bond waivers ──
  check(C(`${p2}.CheckBox73[0]`)!, data.will_waives_bond);
  check(C(`${p2}.CheckBox72[0]`)!, data.special_admin_waives_bond);
  check(C(`${p2}.CheckBox74[0]`)!, data.beneficiaries_waived);
  check(C(`${p2}.CheckBox75[0]`)!, data.heirs_waived);
  check(C(`${p2}.CheckBox76[0]`)!, data.corporate_fiduciary);

  // ── Page 2: Item 3f – Will information ──
  check(C(`${p2}.CheckBox77[0]`)!, data.died_intestate);
  if (!data.died_intestate) {
    check(C(`${p2}.CheckBox78[0]`)!, !!data.will_date);
    safe(F(`${p2}.FillText179[0]`)!, data.will_date);
    if (data.codicil_date) {
      check(C(`${p2}.CheckBox79[0]`)!, true);
    }
    safe(F(`${p2}.FillText181[0]`)!, data.codicil_date);
  }
  check(C(`${p2}.CheckBox65[0]`)!, data.self_proving);

  // ── Page 2: Item 3g – Appointment ──
  // (1) Executor or administrator with will annexed
  check(C(`${p2}.CheckBox57[0]`)!, data.executor_named_in_will); // (a)
  check(C(`${p2}.CheckBox57[1]`)!, data.no_executor_named); // (b)
  check(C(`${p2}.CheckBox58[0]`)!, data.nominee_of_person); // (c)
  // (d) Other named executors will not act
  check(
    C(`${p2}.CheckBox61[0]`)!,
    data.other_executors_not_act_death ||
      data.other_executors_not_act_declination ||
      data.other_executors_not_act_other
  );
  check(C(`${p2}.CheckBox63[0]`)!, data.other_executors_not_act_death);
  check(C(`${p2}.CheckBox62[0]`)!, data.other_executors_not_act_declination);
  check(C(`${p2}.CheckBox64[0]`)!, data.other_executors_not_act_other);
  if (data.other_executors_not_act_other) {
    safe(F(`${p2}.FillText182[0]`)!, data.other_executors_other_reasons);
  }

  // (2) Appointment of administrator
  check(C(`${p2}.CheckBox66[0]`)!, data.petitioner_entitled_to_letters); // (a)
  check(C(`${p2}.CheckBox67[0]`)!, data.petitioner_nominee); // (b)
  safe(F(`${p2}.FillTxt181[0]`)!, data.petitioner_relationship);

  // (3) Special administrator
  check(C(`${p2}.CheckBox69[0]`)!, data.special_admin_requested);

  // ── Page 2: Item 3h – Proposed personal representative ──
  check(C(`${p2}.CheckBox70[0]`)!, data.representative_resident_ca); // (1)
  check(C(`${p2}.CheckBox70[1]`)!, data.representative_nonresident_ca); // (2)
  if (data.representative_nonresident_ca) {
    safe(F(`${p2}.FillText183[0]`)!, data.representative_nonresident_ca_address);
  }
  check(C(`${p2}.CheckBox81[0]`)!, data.representative_resident_us); // (3)
  check(C(`${p2}.CheckBox81[1]`)!, data.representative_nonresident_us); // (4)
  check(C(`${p2}.CheckBox61[1]`)!, data.successor_representative);

  // ── Page 3: Item 4 – Survived by ──
  const p3 = "topmostSubform[0].Page3[0]";
  check(C(`${p3}.CheckBox56[0]`)!, data.survived_by_spouse); // (1) spouse
  check(C(`${p3}.CheckBox55[0]`)!, data.survived_by_no_spouse); // (2) no spouse
  if (data.survived_by_no_spouse) {
    check(
      C(`${p3}.CheckBox53[0]`)!,
      data.no_spouse_reason === "divorced"
    ); // divorced/never married
    check(
      C(`${p3}.CheckBox52[0]`)!,
      data.no_spouse_reason === "deceased"
    ); // spouse deceased
  }
  check(C(`${p3}.CheckBox51[0]`)!, data.survived_by_domestic_partner); // (3)
  check(C(`${p3}.CheckBox51[1]`)!, data.survived_by_no_domestic_partner); // (4)
  check(C(`${p3}.CheckBox49[0]`)!, data.survived_by_child); // (5) child
  if (data.survived_by_child) {
    check(C(`${p3}.CheckBox48[0]`)!, data.child_type === "naturalAdopted");
    check(
      C(`${p3}.CheckBox47[0]`)!,
      data.child_type === "adoptedByThirdParty"
    );
  }
  check(C(`${p3}.CheckBox49[1]`)!, data.survived_by_no_child); // (6)
  check(C(`${p3}.CheckBox45[0]`)!, data.survived_by_issue_of_predeceased); // (7)
  check(C(`${p3}.CheckBox45[1]`)!, data.survived_by_no_issue_of_predeceased); // (8)
  // stepchild was/was not
  check(C(`${p3}.CheckBox43[0]`)!, data.stepchild_survived === "was");
  check(C(`${p3}.CheckBox43[1]`)!, data.stepchild_survived === "wasNot");

  // ── Page 3: Item 5 – Independent administration ──
  check(C(`${p3}.CheckBox41[0]`)!, data.will_does_not_preclude);

  // ── Page 3: Item 6 – Additional survivors ──
  check(C(`${p3}.CheckBox40[0]`)!, data.survived_by_parents); // (1)
  check(C(`${p3}.CheckBox39[0]`)!, data.survived_by_issue_of_parents); // (2)
  check(C(`${p3}.CheckBox38[0]`)!, data.survived_by_grandparents); // (3)
  check(C(`${p3}.CheckBox37[0]`)!, data.survived_by_issue_of_grandparents); // (4)
  check(C(`${p3}.CheckBox36[0]`)!, data.survived_by_issue_of_pre_dec_spouse); // (5)
  check(C(`${p3}.CheckBox35[0]`)!, data.survived_by_next_of_kin); // (6)
  check(C(`${p3}.CheckBox34[0]`)!, data.survived_by_parents_of_pre_dec_spouse); // (7)

  // ── Page 3: Item 7 – Predeceased spouse ──
  check(C(`${p3}.CheckBox33[0]`)!, data.no_pre_dec_spouse); // no predec spouse
  check(C(`${p3}.CheckBox33[1]`)!, !data.no_pre_dec_spouse); // had predec spouse
  if (!data.no_pre_dec_spouse) {
    check(C(`${p3}.CheckBox31[0]`)!, data.pre_dec_spouse_real_property); // (1)
    check(C(`${p3}.CheckBox31[1]`)!, data.pre_dec_spouse_personal_property); // (2)
    check(C(`${p3}.CheckBox24[0]`)!, data.pre_dec_neither_apply); // (3)
    if (data.pre_dec_spouse_real_property || data.pre_dec_spouse_personal_property) {
      check(C(`${p3}.CheckBox29[0]`)!, data.pre_dec_survived_by_issue); // (a)
      check(C(`${p3}.CheckBox28[0]`)!, data.pre_dec_survived_by_parents); // (b)
      check(
        C(`${p3}.CheckBox27[0]`)!,
        data.pre_dec_survived_by_issue_of_parent
      ); // (c)
      check(
        C(`${p3}.CheckBox26[0]`)!,
        data.pre_dec_survived_by_next_of_kin_decedent
      ); // (d)
      check(
        C(`${p3}.CheckBox25[0]`)!,
        data.pre_dec_survived_by_next_of_kin_pre_dec
      ); // (e)
    }
  }

  // ── Page 3: Item 8 statement ──
  check(
    C(`${p3}.CheckBox34[0]`)!,
    data.survived_by_no_known_next_of_kin || data.survived_by_parents_of_pre_dec_spouse
  );

  // ── Page 4: Item 8 – Persons table ──
  const p4 = "topmostSubform[0].Page4[0]";
  const maxPersons = Math.min(data.persons.length, 10);
  for (let i = 0; i < maxPersons; i++) {
    const person = data.persons[i];
    if (!person.name && !person.relationship && !person.age && !person.address)
      continue;
    const nameRel = [person.name, person.relationship]
      .filter(Boolean)
      .join(" — ");
    const idx = 9 - i; // fields are numbered top-to-bottom: [9] is top row
    safe(F(`${p4}.FillText352[${idx}]`)!, nameRel);
    safe(F(`${p4}.FillText351[${idx}]`)!, person.age);
    safe(F(`${p4}.FillText350[${idx}]`)!, person.address);
  }

  // continued on attachment
  check(C(`${p4}.CheckBox83[0]`)!, data.continued_on_attachment_8);

  // ── Page 4: Signatures ──
  safe(F(`${p4}.FillText277[0]`)!, data.number_of_pages_attached);
  safe(F(`${p4}.FillText276[0]`)!, data.signature_date);
  safe(F(`${p4}.FillText358[0]`)!, data.attorney_print_name);
  safe(F(`${p4}.FillText357[0]`)!, data.petitioner_1_print_name);
  safe(F(`${p4}.FillText276[1]`)!, data.signature_date);
  safe(F(`${p4}.FillText357[1]`)!, data.petitioner_2_print_name);
  check(C(`${p4}.CheckBox82[0]`)!, data.additional_petitioners_on_attachment);

  // Flatten so the filled values appear in readers that don't render form fields
  form.flatten();

  return doc.save();
}

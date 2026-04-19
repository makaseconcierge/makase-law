import { PDFDocument } from "pdf-lib";
import type { DE140FormData } from "@/lib/de140-types";

function safe(field: { setText: (v: string) => void } | null, value: string) {
  try {
    if (field && value) field.setText(value);
  } catch {
    /* field may not support setText */
  }
}

function check(
  field: { check: () => void; uncheck: () => void } | null,
  value: boolean
) {
  try {
    if (!field) return;
    if (value) field.check();
    else field.uncheck();
  } catch {
    /* field may not support check */
  }
}

export async function generateDE140PDF(
  data: DE140FormData
): Promise<Uint8Array> {
  const pdfBytes = await fetch("/de140.pdf").then((r) => r.arrayBuffer());
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
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

  const p = "DE-140[0].Page1[0]";
  const cap = `${p}.P1Caption[0]`;

  // ── Header: Attorney / Party info ──
  safe(F(`${cap}.AttyPartyInfo[0].TextField1[0]`), data.attorney_info);
  safe(F(`${cap}.AttyPartyInfo[0].Phone[0]`), data.telephone);
  safe(F(`${cap}.AttyPartyInfo[0].Email[0]`), data.email);

  // ── Header: Court info ──
  safe(F(`${cap}.CourtInfo[0].CrtCounty[0]`), data.county);
  safe(F(`${cap}.CourtInfo[0].CrtStreet[0]`), data.court_street);
  safe(F(`${cap}.CourtInfo[0].CrtMailingAdd[0]`), data.court_mailing);
  safe(F(`${cap}.CourtInfo[0].CrtBranch[0]`), data.branch_name);
  safe(F(`${cap}.CourtInfo[0].CrtCityZip[0]`), data.court_city_zip);

  // ── Header: Case caption ──
  safe(F(`${cap}.TitlePartyName[0].Party1_ft[0]`), data.estate_name);
  safe(F(`${cap}.CaseNumber[0].CaseNumber[0]`), data.case_number);

  // ── Title checkboxes ──
  const ft = `${cap}.FormTitle[0]`;
  check(C(`${ft}.CheckBox23[0]`), data.title_executor);
  check(C(`${ft}.CheckBox22[0]`), data.title_admin_will_annexed);
  check(C(`${ft}.CheckBox21[0]`), data.title_administrator);
  check(C(`${ft}.CheckBox20[0]`), data.title_special_admin);
  check(C(`${ft}.CheckBox17[0]`), data.title_independent_admin);
  check(C(`${ft}.CheckBox18[0]`), data.title_full_authority);
  check(C(`${ft}.CheckBox18[1]`), data.title_limited_authority);

  // ── 1. Court Finds ──
  safe(F(`${p}.FillText1[1]`), data.death_date);
  check(C(`${p}.CheckBox45[0]`), data.residence_type === "resident");
  check(C(`${p}.CheckBox45[1]`), data.residence_type === "nonresident");
  check(C(`${p}.CheckBox89[0]`), data.died_intestate);
  check(C(`${p}.CheckBox89[1]`), !data.died_intestate);
  if (!data.died_intestate) {
    safe(F(`${p}.FillText1[2]`), data.will_date);
    safe(F(`${p}.FillText1[3]`), data.codicil_date);
  }
  safe(F(`${p}.SigDate[1]`), data.minute_order_date);

  // ── 2. Court Orders – appointment ──
  safe(F(`${p}.FillText143[0]`), data.representative_name);
  check(C(`${p}.CheckBox5[0]`), data.appoint_executor);
  check(C(`${p}.CheckBox6[0]`), data.appoint_admin_will_annexed);
  check(C(`${p}.CheckBox7[0]`), data.appoint_administrator);
  check(C(`${p}.CheckBox8[0]`), data.appoint_special_admin);

  // 2d sub-options (special admin)
  check(C(`${p}.Choice1[3]`), data.special_admin_general_powers);
  check(C(`${p}.Choice1[4]`), data.special_admin_special_powers);
  check(C(`${p}.Choice1[5]`), data.special_admin_without_notice);
  safe(F(`${p}.HearingTime[1]`), data.letters_expire_date);

  // ── 3. Hearing ──
  safe(F(`${p}.HearingDate[0]`), data.hearing_date);
  safe(F(`${p}.HearingTime[0]`), data.hearing_time);
  safe(F(`${p}.HearingDept[0]`), data.hearing_dept);
  safe(F(`${p}.HearingRm[0]`), data.hearing_room_judge);

  // ── 4. Independent administration ──
  check(C(`${p}.CheckBox41[0]`), data.full_authority);
  check(C(`${p}.CheckBox41[1]`), data.limited_authority);

  // ── 5. Bond ──
  check(C(`${p}.CheckBox5[1]`), data.bond_not_required);
  safe(F(`${p}.HearingTime[2]`), data.bond_amount);
  safe(F(`${p}.FillText1[5]`), data.deposit_amount);
  safe(F(`${p}.FillText1[4]`), data.deposit_institution);
  check(C(`${p}.limited[1]`), data.not_authorized_without_order);

  // ── 6. Probate referee ──
  safe(F(`${p}.FillText1[4]`), data.probate_referee_name);

  // ── 7. Pages attached ──
  safe(F(`${p}.NumericField1[0]`), data.number_of_pages_attached);

  // ── Date ──
  safe(F(`${p}.SigDate[0]`), data.order_date);

  form.flatten();
  return doc.save();
}

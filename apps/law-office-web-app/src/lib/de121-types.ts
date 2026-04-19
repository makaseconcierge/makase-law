export interface MailedPerson {
  name: string;
  address: string;
}

export interface ClientDE121FormData {
  estate_name: string;
  decedent_other_names: string;
  petitioner_name: string;
  representative_name: string;
  admit_will: boolean;
  independent_admin: boolean;
  hearing_date: string;
  hearing_time: string;
  hearing_dept: string;
  hearing_room: string;
  court_address_same: boolean;
  court_address_other: string;
  mailed_persons: MailedPerson[];
  continued_on_attachment: boolean;
}

export function createEmptyDE121ClientData(): ClientDE121FormData {
  return {
    estate_name: "",
    decedent_other_names: "",
    petitioner_name: "",
    representative_name: "",
    admit_will: false,
    independent_admin: false,
    hearing_date: "",
    hearing_time: "",
    hearing_dept: "",
    hearing_room: "",
    court_address_same: true,
    court_address_other: "",
    mailed_persons: [{ name: "", address: "" }],
    continued_on_attachment: false,
  };
}

import raw from "../../content/testimonies.json";

/** One entry in content/testimonies.json (brief 10.4). */
export type Testimony = {
  id: string;
  displayName: string;
  place: string;
  text: string;
  category: "prayer" | "healing" | "deliverance" | "marriage" | "dreams" | "other";
  receivedOn: string;
  consentDate: string;
  consentForm: string;
  approvedBy: string;
  editNote?: string;
};

/** Only entries with a full consent record are ever shown. */
export const TESTIMONIES: Testimony[] = (raw as unknown as Testimony[]).filter(
  (t) => t.text?.trim() && t.displayName?.trim() && t.consentDate && t.consentForm && t.approvedBy
);

export const TESTIMONY_LINE = "This is one person's account. It is not a promise of the same result.";

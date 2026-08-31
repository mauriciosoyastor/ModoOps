export type AccentKey =
  | "flame-yellow"
  | "flame-orange"
  | "flame-deep"
  | "flame-rust"
  | "ember-amber"
  | "ember-coral"
  | "ember-scarlet"
  | "ember-wine"
  | "bg-mid"
  | "bg-charcoal"
  | "bg-deep";

export type LauncherTile = {
  id: number;
  label: string;
  hint: string;
  icon: string;
  enter_label: string;
  target_type: "hub" | "action";
  client_tag: string;
  accent_key: AccentKey | string;
  value: string;
  action: Record<string, unknown> | false;
};

export type HubCard = {
  id: number;
  label: string;
  hint: string;
  icon: string;
  variant: string;
  accent_key: AccentKey | string;
  enter_label: string;
  value: string;
  action: Record<string, unknown>;
};

export type HubPayload = {
  app: string;
  section: string;
  sections: { code: string; name: string; icon: string }[];
  cards: HubCard[];
  groups?: { code: string; name: string; icon: string; cards: HubCard[] }[];
};

export type LauncherPayload = { tiles: LauncherTile[] };
export type SessionInfo = { uid: number; name: string; login: string };

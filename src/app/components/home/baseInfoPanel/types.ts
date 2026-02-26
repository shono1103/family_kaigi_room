export type BaseUserInfo = {
  name: string;
  role: string;
  symbolPubKey: string | null;
} | null;

export type BaseInfoPanelMode = "view" | "edit";

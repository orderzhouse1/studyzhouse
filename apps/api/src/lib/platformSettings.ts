import { prisma } from "./prisma.js";

export const PLATFORM_SETTINGS_KEY = "platform_governance";

export type PlatformSettingsJson = {
  platformName: string;
  supportEmail: string;
  cliqAlias: string;
  cliqInstructions: string;
  allowStudentSignup: boolean;
  maintenanceMode: boolean;
};

const DEFAULT_SETTINGS: PlatformSettingsJson = {
  platformName: "Studyhouse",
  supportEmail: "",
  cliqAlias: "",
  cliqInstructions: "",
  allowStudentSignup: true,
  maintenanceMode: false,
};

export async function loadPlatformSettings(): Promise<PlatformSettingsJson> {
  const row = await prisma.appSetting.findUnique({
    where: { key: PLATFORM_SETTINGS_KEY },
  });
  if (!row?.valueJson || typeof row.valueJson !== "object") {
    return { ...DEFAULT_SETTINGS };
  }
  const j = row.valueJson as Record<string, unknown>;
  return {
    platformName:
      typeof j.platformName === "string"
        ? j.platformName
        : DEFAULT_SETTINGS.platformName,
    supportEmail:
      typeof j.supportEmail === "string"
        ? j.supportEmail
        : DEFAULT_SETTINGS.supportEmail,
    cliqAlias:
      typeof j.cliqAlias === "string" ? j.cliqAlias : DEFAULT_SETTINGS.cliqAlias,
    cliqInstructions:
      typeof j.cliqInstructions === "string"
        ? j.cliqInstructions
        : DEFAULT_SETTINGS.cliqInstructions,
    allowStudentSignup:
      typeof j.allowStudentSignup === "boolean"
        ? j.allowStudentSignup
        : DEFAULT_SETTINGS.allowStudentSignup,
    maintenanceMode:
      typeof j.maintenanceMode === "boolean"
        ? j.maintenanceMode
        : DEFAULT_SETTINGS.maintenanceMode,
  };
}

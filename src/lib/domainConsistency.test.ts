import { describe, expect, it } from "vitest";
import manifest from "../../public/manifest.json";
import { SOCIAL_HOSTS } from "./feedRules";

function permissionHostToDomain(hostPermission: string): string {
  return hostPermission.replace("https://*.", "").replace("/*", "");
}

describe("domain consistency", () => {
  it("keeps manifest host permissions aligned with supported feed cleaner hosts", () => {
    const manifestHosts = (manifest.host_permissions ?? []).map(permissionHostToDomain).sort();
    const ruleHosts = [...SOCIAL_HOSTS].sort();

    expect(manifestHosts).toEqual(ruleHosts);
  });
});

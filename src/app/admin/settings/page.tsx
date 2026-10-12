import { requireStaff } from "@/server/auth";
import { getSettings, contentChoices } from "@/server/services/content";
import { SettingsEditor } from "@/features/settings/editor";
export default async function Settings() {
  const user = await requireStaff();
  if (user.role === "EDITOR")
    return (
      <p className="notice">Only administrators can change global settings.</p>
    );
  const [settings, choices] = await Promise.all([
    getSettings(),
    contentChoices(),
  ]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Site settings</h1>
          <p>
            Lab identity, contact details, social links, and navigation labels.
          </p>
        </div>
      </div>
      <SettingsEditor
        initial={settings.data}
        version={settings.version}
        media={choices.media}
      />
    </>
  );
}

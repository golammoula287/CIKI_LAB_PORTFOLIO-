import { requireStaff } from "@/server/auth";
import { canPublish } from "@/features/achievements/schema";
import { AchievementEditor } from "@/features/achievements/editor";
import { contentChoices, authorChoices } from "@/server/services/content";
export default async function NewAchievement() {
  const user = await requireStaff();
  const [choices, people] = await Promise.all([
    contentChoices(),
    authorChoices(),
  ]);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>New achievement</h1>
          <p>Start with a private draft.</p>
        </div>
      </div>
      <AchievementEditor
        departments={choices.departments}
        people={people}
        allowPublish={canPublish(user.role)}
        initial={{
          title: "",
          slug: "",
          type: "CONFERENCE",
          year: new Date().getFullYear(),
          status: "UNDER_REVIEW",
          authors: "",
          venue: "",
          abstract: "",
          url: "",
          disclosureApproved: false,
        }}
      />
    </>
  );
}

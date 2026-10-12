import { requireStaff } from "@/server/auth";
import { ChangePassword } from "@/features/staff/forms";
export default async function Account() {
  await requireStaff();
  return (
    <>
      <div className="admin-heading">
        <h1>Your account</h1>
      </div>
      <ChangePassword />
    </>
  );
}

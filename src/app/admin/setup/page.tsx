import { requireStaff } from "@/server/auth";
import { storageDriver } from "@/server/storage";
export default async function Setup() {
  await requireStaff();
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Project setup</h1>
          <p>Integration status and operating guidance.</p>
        </div>
      </div>
      <section className="panel">
        <h2>Application modules</h2>
        <p>
          Pages, departments, people and advisory profiles, achievements,
          recruitment, FAQs, albums, media, site settings, membership
          categories, staff access, and audit history are available in the
          sidebar.
        </p>
        <h2>Storage</h2>
        <p>
          Selected driver: {storageDriver()}.{" "}
          {storageDriver() === "local"
            ? "Local files require persistent disk and a single shared storage host. Use S3-compatible private storage on serverless hosting."
            : "S3 credentials and bucket access must be validated in your deployment environment."}
        </p>
        <h2>Before production launch</h2>
        <p>
          Apply migrations, run the seed command, replace provisional copy,
          review research disclosures, test owner recovery, and rehearse a
          backup restore. Follow docs/SETUP.md and docs/OPERATIONS.md.
        </p>
      </section>
    </>
  );
}

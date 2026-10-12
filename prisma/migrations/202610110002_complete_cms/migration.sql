-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('PAGE', 'DEPARTMENT', 'PERSON', 'POSITION', 'FAQ', 'ALBUM');

-- AlterTable
ALTER TABLE "AchievementRevision" ADD COLUMN     "requestedSlug" TEXT;

-- CreateTable
CREATE TABLE "ContentRecord" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedRevisionId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "seoTitle" TEXT NOT NULL,
    "seoDescription" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "advisory" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentLink" (
    "revisionId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,

    CONSTRAINT "ContentLink_pkey" PRIMARY KEY ("revisionId","targetId")
);

-- CreateTable
CREATE TABLE "ContentRedirect" (
    "id" TEXT NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,

    CONSTRAINT "ContentRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementRedirect" (
    "oldSlug" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,

    CONSTRAINT "AchievementRedirect_pkey" PRIMARY KEY ("oldSlug")
);

-- CreateTable
CREATE TABLE "AchievementAuthor" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "personId" TEXT,
    "name" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "AchievementAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AchievementDepartment" (
    "revisionId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "AchievementDepartment_pkey" PRIMARY KEY ("revisionId","departmentId")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionMedia" (
    "revisionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,

    CONSTRAINT "RevisionMedia_pkey" PRIMARY KEY ("revisionId","assetId")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'site',
    "version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "logoId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessGrant" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentRecord_publishedRevisionId_key" ON "ContentRecord"("publishedRevisionId");

-- CreateIndex
CREATE INDEX "ContentRecord_kind_archivedAt_idx" ON "ContentRecord"("kind", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRecord_kind_slug_key" ON "ContentRecord"("kind", "slug");

-- CreateIndex
CREATE INDEX "ContentRevision_sortOrder_idx" ON "ContentRevision"("sortOrder");

-- CreateIndex
CREATE INDEX "ContentRevision_categoryId_advisory_idx" ON "ContentRevision"("categoryId", "advisory");

-- CreateIndex
CREATE INDEX "ContentRevision_closed_deadline_idx" ON "ContentRevision"("closed", "deadline");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_recordId_version_key" ON "ContentRevision"("recordId", "version");

-- CreateIndex
CREATE INDEX "ContentLink_targetId_idx" ON "ContentLink"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRedirect_kind_oldSlug_key" ON "ContentRedirect"("kind", "oldSlug");

-- CreateIndex
CREATE UNIQUE INDEX "AchievementAuthor_revisionId_sortOrder_key" ON "AchievementAuthor"("revisionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "RevisionMedia_assetId_idx" ON "RevisionMedia"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessGrant_tokenHash_key" ON "AccessGrant"("tokenHash");

-- CreateIndex
CREATE INDEX "AccessGrant_email_usedAt_idx" ON "AccessGrant"("email", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- AddForeignKey
ALTER TABLE "ContentRecord" ADD CONSTRAINT "ContentRecord_publishedRevisionId_fkey" FOREIGN KEY ("publishedRevisionId") REFERENCES "ContentRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ContentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MembershipCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentLink" ADD CONSTRAINT "ContentLink_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ContentRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentLink" ADD CONSTRAINT "ContentLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "ContentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentRedirect" ADD CONSTRAINT "ContentRedirect_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ContentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementRedirect" ADD CONSTRAINT "AchievementRedirect_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementAuthor" ADD CONSTRAINT "AchievementAuthor_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "AchievementRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementAuthor" ADD CONSTRAINT "AchievementAuthor_personId_fkey" FOREIGN KEY ("personId") REFERENCES "ContentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementDepartment" ADD CONSTRAINT "AchievementDepartment_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "AchievementRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AchievementDepartment" ADD CONSTRAINT "AchievementDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "ContentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionMedia" ADD CONSTRAINT "RevisionMedia_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ContentRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionMedia" ADD CONSTRAINT "RevisionMedia_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSettings" ADD CONSTRAINT "SiteSettings_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

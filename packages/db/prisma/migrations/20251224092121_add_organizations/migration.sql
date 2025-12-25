-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "trial_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_members" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "user_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_customer_id_key" ON "organizations"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stripe_subscription_id_key" ON "organizations"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "org_members_user_id_idx" ON "org_members"("user_id");

-- CreateIndex
CREATE INDEX "org_members_org_id_idx" ON "org_members"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_members_user_id_org_id_key" ON "org_members"("user_id", "org_id");

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: Create org for each user with projects, migrate projects
DO $$
DECLARE
    user_record RECORD;
    new_org_id TEXT;
    slug_base TEXT;
    final_slug TEXT;
    counter INT;
BEGIN
    FOR user_record IN
        SELECT DISTINCT u.id, u.email, u.name
        FROM "user" u
        INNER JOIN "projects" p ON p.user_id = u.id
    LOOP
        -- Generate org ID (cuid-like)
        new_org_id := 'org_' || encode(gen_random_bytes(12), 'hex');

        -- Generate slug from email prefix
        slug_base := lower(regexp_replace(split_part(user_record.email, '@', 1), '[^a-z0-9]', '-', 'g'));
        final_slug := slug_base;
        counter := 1;

        -- Ensure unique slug
        WHILE EXISTS (SELECT 1 FROM "organizations" WHERE slug = final_slug) LOOP
            final_slug := slug_base || '-' || counter;
            counter := counter + 1;
        END LOOP;

        -- Create organization with 14-day trial
        INSERT INTO "organizations" (id, name, slug, plan, trial_ends_at, created_at, updated_at)
        VALUES (
            new_org_id,
            COALESCE(user_record.name, split_part(user_record.email, '@', 1)) || '''s Organization',
            final_slug,
            'free',
            NOW() + INTERVAL '14 days',
            NOW(),
            NOW()
        );

        -- Add user as owner
        INSERT INTO "org_members" (id, role, user_id, org_id, created_at)
        VALUES (
            'mem_' || encode(gen_random_bytes(12), 'hex'),
            'owner',
            user_record.id,
            new_org_id,
            NOW()
        );

        -- Update projects to belong to this org
        UPDATE "projects" SET user_id = new_org_id WHERE user_id = user_record.id;
    END LOOP;
END $$;

-- Now safe to rename the column
ALTER TABLE "projects" RENAME COLUMN "user_id" TO "org_id";

-- DropForeignKey (old one)
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_user_id_fkey";

-- DropIndex (old one)
DROP INDEX IF EXISTS "projects_user_id_idx";

-- CreateIndex
CREATE INDEX "projects_org_id_idx" ON "projects"("org_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "discussions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "author_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "discussions_user_id_idx" ON "discussions"("user_id");

-- AddForeignKey
ALTER TABLE "discussions"
ADD CONSTRAINT "discussions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

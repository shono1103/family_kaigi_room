-- CreateTable
CREATE TABLE "discussion_chat_rooms" (
    "id" UUID NOT NULL,
    "discussion_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discussion_chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discussion_chat_messages" (
    "id" UUID NOT NULL,
    "chat_room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discussion_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discussion_chat_rooms_discussion_id_key" ON "discussion_chat_rooms"("discussion_id");

-- CreateIndex
CREATE INDEX "discussion_chat_messages_chat_room_id_idx" ON "discussion_chat_messages"("chat_room_id");

-- CreateIndex
CREATE INDEX "discussion_chat_messages_user_id_idx" ON "discussion_chat_messages"("user_id");

-- AddForeignKey
ALTER TABLE "discussion_chat_rooms" ADD CONSTRAINT "discussion_chat_rooms_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_chat_messages" ADD CONSTRAINT "discussion_chat_messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "discussion_chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussion_chat_messages" ADD CONSTRAINT "discussion_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

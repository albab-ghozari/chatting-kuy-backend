-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_conversationId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "groupAvatar" TEXT,
ADD COLUMN     "groupName" TEXT,
ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

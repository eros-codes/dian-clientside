export interface Comment {
  id: string;
  name: string | null;
  message: string;
  adminReply: string | null;
  isReplied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  name?: string;
  message: string;
}

export interface ReplyCommentDto {
  adminReply: string;
}

import useSWR from 'swr';
import { apiRequest } from '@/lib/api';
import { Comment, CreateCommentDto, ReplyCommentDto } from '@/types/comment';

export function usePublicComments() {
  return useSWR<Comment[]>('/comments/public', async (url: string) =>
    apiRequest<Comment[]>(url, { method: 'GET' })
  );
}

export function useAdminComments() {
  return useSWR<Comment[]>('/comments/admin/all', async (url: string) =>
    apiRequest<Comment[]>(url, { method: 'GET' })
  );
}

export async function createComment(data: CreateCommentDto): Promise<Comment> {
  return await apiRequest<Comment>('/comments', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function replyToComment(
  id: string,
  data: ReplyCommentDto
): Promise<Comment> {
  return await apiRequest<Comment>(`/comments/${id}/reply`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function updateReply(
  id: string,
  data: ReplyCommentDto
): Promise<Comment> {
  return await apiRequest<Comment>(`/comments/${id}/update-reply`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
}

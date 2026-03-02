export interface ApiResponse<T> {
  data?: T | null;
  success: boolean;
  message: string;
  error?: string;
}

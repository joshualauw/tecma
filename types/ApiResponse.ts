export interface ApiResponse<T> {
  data?: T | null;
  success: boolean;
  message: string;
}

export interface BaseApiData {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: number;
    name: string;
  } | null;
  updatedBy: {
    id: number;
    name: string;
  } | null;
}

import axios, { AxiosError } from "axios";

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

/**
 * Type guard to check if error is an AxiosError
 */
export function isAxiosError(
  error: unknown
): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError(error);
}

/**
 * Safely extract a readable error message
 */
export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong"
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error occurred";
}

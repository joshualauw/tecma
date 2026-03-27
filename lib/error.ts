import { Prisma } from "@/generated/prisma/client";
import { logger } from "@/lib/logger";
import { AxiosError } from "axios";
import { ZodError } from "zod";

export interface ErrorResponse {
  message: string;
  code: number;
}

export class AuthorizationError extends Error {
  constructor(message?: string) {
    super(message ?? "You are not authorized to access this resource");
    this.name = "AuthorizationError";
  }
}

function serializeError(err: Error): unknown {
  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
    ...(err as unknown as Record<string, unknown>),
  } as unknown;
}

export function handleError(action: string, error: unknown): ErrorResponse {
  logger.error(`Error occurred during: ${action}`, {
    action,
    error: error instanceof Error ? serializeError(error) : error,
  });

  if (error instanceof AxiosError) {
    return handleAxiosError(error);
  } else if (error instanceof ZodError) {
    return handleFormValidationError();
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  } else if (error instanceof AuthorizationError) {
    return handleAuthorizationError(error);
  } else if (error instanceof Error) {
    return handleBasicError(error);
  }

  return { message: "An unknown error occurred", code: 500 };
}

function handleBasicError(error: Error): ErrorResponse {
  return { message: error.message, code: 500 };
}

function handleFormValidationError(): ErrorResponse {
  return { message: "Invalid input", code: 400 };
}

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError): ErrorResponse {
  if (error.code === "P2025") {
    return { message: "Record not found", code: 404 };
  } else if (error.code === "P2002") {
    return { message: `Unique constraint failed`, code: 400 };
  } else if (error.code === "P2003") {
    return { message: "Foreign key constraint failed", code: 400 };
  } else if (error.code === "P2004") {
    return { message: "Invalid input", code: 400 };
  } else if (error.code === "P2005") {
    return { message: "Invalid input", code: 400 };
  }

  return { message: "An unknown prisma error occurred", code: 500 };
}

function handleAuthorizationError(error: AuthorizationError): ErrorResponse {
  return { message: error.message, code: 403 };
}

function handleAxiosError(error: AxiosError): ErrorResponse {
  return { message: error.message, code: error.response?.status || 500 };
}

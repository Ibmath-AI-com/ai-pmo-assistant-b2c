"""
Error response schemas for API documentation.
"""
from pydantic import BaseModel, Field
from typing import Any, Optional


class ErrorDetail(BaseModel):
    """Standard error response model."""
    detail: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Machine-readable error code")
    timestamp: Optional[str] = Field(None, description="ISO 8601 timestamp of error")
    path: Optional[str] = Field(None, description="Request path")


class ValidationError(BaseModel):
    """Validation error response model."""
    detail: str = Field("Validation failed", description="Error message")
    errors: list[dict[str, Any]] = Field(..., description="List of validation errors")


class ConflictError(BaseModel):
    """Conflict/constraint violation error model."""
    detail: str = Field(..., description="Error message")
    error_code: str = Field("CONFLICT", description="Machine-readable error code")
    conflicting_field: Optional[str] = Field(None, description="Field causing the conflict")


class UserNotFoundError(BaseModel):
    """Error raised when a referenced user does not exist."""
    detail: str = Field(..., description="Error message")
    error_code: str = Field("USER_NOT_FOUND", description="Machine-readable error code")
    user_id: Optional[str] = Field(None, description="The user_id that was not found")


# Standard error responses for different scenarios
ERROR_RESPONSES = {
    400: {
        "model": ValidationError,
        "description": "Bad Request - Invalid input or validation failed",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Validation failed",
                    "errors": [
                        {
                            "loc": ["body", "persona_name"],
                            "msg": "String should have at most 255 characters",
                            "type": "string_too_long"
                        }
                    ]
                }
            }
        }
    },
    401: {
        "model": ErrorDetail,
        "description": "Unauthorized - Authentication required or token invalid",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Not authenticated",
                    "error_code": "UNAUTHORIZED"
                }
            }
        }
    },
    403: {
        "model": ErrorDetail,
        "description": "Forbidden - Insufficient permissions or access denied",
        "content": {
            "application/json": {
                "example": {
                    "detail": "User does not have permission to perform this action",
                    "error_code": "FORBIDDEN"
                }
            }
        }
    },
    404: {
        "model": ErrorDetail,
        "description": "Not Found - Resource does not exist",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Persona not found",
                    "error_code": "NOT_FOUND"
                }
            }
        }
    },
    409: {
        "model": ConflictError,
        "description": "Conflict - Resource already exists or constraint violation",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Persona with code 'PMO_001' already exists",
                    "error_code": "CONFLICT",
                    "conflicting_field": "persona_code"
                }
            }
        }
    },
    422: {
        "model": ValidationError,
        "description": "Unprocessable Entity - Invalid request body or schema",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Validation failed",
                    "errors": [
                        {
                            "loc": ["body", "persona_category"],
                            "msg": "Input should be 'PMO', 'Strategy', 'Risk', 'Portfolio' or 'Custom'",
                            "type": "enum"
                        }
                    ]
                }
            }
        }
    },
}


# Common response combinations
RESPONSES_CREATE = {
    400: ERROR_RESPONSES[400],
    401: ERROR_RESPONSES[401],
    409: ERROR_RESPONSES[409],
    422: ERROR_RESPONSES[422],
}

RESPONSES_READ = {
    401: ERROR_RESPONSES[401],
    404: ERROR_RESPONSES[404],
}

RESPONSES_LIST = {
    401: ERROR_RESPONSES[401],
}

RESPONSES_UPDATE = {
    400: ERROR_RESPONSES[400],
    401: ERROR_RESPONSES[401],
    404: ERROR_RESPONSES[404],
    409: ERROR_RESPONSES[409],
    422: ERROR_RESPONSES[422],
}

RESPONSES_DELETE = {
    401: ERROR_RESPONSES[401],
    404: ERROR_RESPONSES[404],
}

RESPONSES_PATCH = {
    400: ERROR_RESPONSES[400],
    401: ERROR_RESPONSES[401],
    404: ERROR_RESPONSES[404],
    409: ERROR_RESPONSES[409],
    422: ERROR_RESPONSES[422],
}

RESPONSES_ADD_MEMBER = {
    400: ERROR_RESPONSES[400],
    401: ERROR_RESPONSES[401],
    404: ERROR_RESPONSES[404],
    409: ERROR_RESPONSES[409],
    422: ERROR_RESPONSES[422],
}

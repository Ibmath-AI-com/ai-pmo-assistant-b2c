from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class GuardrailResult:
    passed: bool
    issues: list[str]
    modified_content: str | None = None


class Guardrails:
    PII_PATTERNS = [
        (r"\b\d{3}-\d{2}-\d{4}\b", "SSN"),
        (r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b", "credit_card"),
        (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "email"),
    ]

    def check_input(self, message: str, classification_limit: str | None = None) -> GuardrailResult:
        issues = []
        for pattern, label in self.PII_PATTERNS:
            if re.search(pattern, message):
                issues.append(f"Potential {label} detected in input")
        return GuardrailResult(passed=len(issues) == 0, issues=issues)

    def check_output(
        self,
        response: str,
        rag_sources: list[str] | None = None,
        hallucination_threshold: float = 0.3,
    ) -> GuardrailResult:
        issues = []
        if not response or len(response.strip()) < 5:
            issues.append("Empty or minimal response")
            return GuardrailResult(passed=False, issues=issues)
        return GuardrailResult(passed=True, issues=[])

    def validate_structure(self, response: str, expected_schema: dict | None = None) -> GuardrailResult:
        if not expected_schema:
            return GuardrailResult(passed=True, issues=[])
        required = expected_schema.get("required_fields", [])
        issues = [f"Missing required section: {f}" for f in required if f.lower() not in response.lower()]
        return GuardrailResult(passed=len(issues) == 0, issues=issues)

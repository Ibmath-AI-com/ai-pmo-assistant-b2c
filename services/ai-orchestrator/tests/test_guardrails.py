"""Tests for Guardrails — PII detection, output validation, structure validation."""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "shared"))

from app.core.guardrails import Guardrails


@pytest.fixture
def g():
    return Guardrails()


# --- Input PII detection ---

def test_ssn_in_input_fails(g):
    result = g.check_input("My SSN is 123-45-6789, please advise.")
    assert result.passed is False
    assert any("SSN" in issue for issue in result.issues)


def test_credit_card_in_input_fails(g):
    result = g.check_input("Card number: 4111 1111 1111 1111")
    assert result.passed is False
    assert any("credit_card" in issue for issue in result.issues)


def test_email_in_input_fails(g):
    result = g.check_input("Contact me at john.doe@example.com for details.")
    assert result.passed is False
    assert any("email" in issue for issue in result.issues)


def test_clean_input_passes(g):
    result = g.check_input("What is the best approach for risk management in an agile project?")
    assert result.passed is True
    assert result.issues == []


def test_multiple_pii_types_all_reported(g):
    result = g.check_input("SSN: 123-45-6789 email: user@test.com")
    assert result.passed is False
    assert len(result.issues) >= 2


# --- Output validation ---

def test_empty_response_fails(g):
    result = g.check_output("")
    assert result.passed is False


def test_whitespace_only_response_fails(g):
    result = g.check_output("    ")
    assert result.passed is False


def test_valid_response_passes(g):
    result = g.check_output("Here is a detailed risk assessment for your project...")
    assert result.passed is True
    assert result.issues == []


# --- Structure validation ---

def test_structure_validation_no_schema_passes(g):
    result = g.validate_structure("Any response text", expected_schema=None)
    assert result.passed is True


def test_structure_validation_all_fields_present(g):
    result = g.validate_structure(
        "risks: high. risk_matrix: 5x5. mitigations: avoid and transfer.",
        expected_schema={"required_fields": ["risks", "risk_matrix", "mitigations"]},
    )
    assert result.passed is True


def test_structure_validation_missing_field_fails(g):
    result = g.validate_structure(
        "risks: high. risk_matrix: 5x5.",
        expected_schema={"required_fields": ["risks", "risk_matrix", "mitigations"]},
    )
    assert result.passed is False
    assert any("mitigations" in issue for issue in result.issues)


def test_structure_validation_case_insensitive(g):
    result = g.validate_structure(
        "RISKS identified. RISK_MATRIX attached. MITIGATIONS proposed.",
        expected_schema={"required_fields": ["risks", "risk_matrix", "mitigations"]},
    )
    assert result.passed is True

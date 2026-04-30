"""Seed system ready prompts for Phase 4."""
import asyncio
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from db.base import async_session_factory
from db.models.prompt import PromptLibrary

READY_PROMPTS = [
    {
        "prompt_name": "Create Project Charter",
        "prompt_text": "Create a comprehensive project charter for my project. Include: Project Overview, Objectives, Scope, Stakeholders, Timeline, Budget Estimate, Key Risks, and Success Criteria.",
        "prompt_category": "PMO",
        "is_ready_prompt": True,
        "is_system": True,
    },
    {
        "prompt_name": "Update RAID Log",
        "prompt_text": "Help me update my RAID log. Identify and categorize all Risks, Assumptions, Issues, and Dependencies based on our current project context. For each risk, provide likelihood, impact, and recommended response strategy.",
        "prompt_category": "Risk",
        "is_ready_prompt": True,
        "is_system": True,
    },
    {
        "prompt_name": "Generate Project Status Report",
        "prompt_text": "Generate a comprehensive project status report. Include: Executive Summary, Current Status (RAG rating), Milestone Progress, Budget Status, Key Risks & Issues, Accomplishments this period, and Next Steps.",
        "prompt_category": "PMO",
        "is_ready_prompt": True,
        "is_system": True,
    },
    {
        "prompt_name": "Risk Assessment",
        "prompt_text": "Perform a thorough risk assessment for my project. Identify all potential risks, categorize them (Technical/Resource/Schedule/Budget/External), rate likelihood and impact on a 1-5 scale, calculate risk scores, and recommend mitigation strategies.",
        "prompt_category": "Risk",
        "is_ready_prompt": True,
        "is_system": True,
    },
    {
        "prompt_name": "Strategic KPI Review",
        "prompt_text": "Review my strategic KPIs using the balanced scorecard framework. Analyze performance across Financial, Customer, Internal Process, and Learning & Growth perspectives. Identify gaps and provide strategic recommendations.",
        "prompt_category": "Strategy",
        "is_ready_prompt": True,
        "is_system": True,
    },
    {
        "prompt_name": "Stakeholder Analysis",
        "prompt_text": "Help me create a stakeholder analysis matrix. Identify all project stakeholders, assess their power/interest levels, map their communication preferences, and suggest engagement strategies for each stakeholder group.",
        "prompt_category": "PMO",
        "is_ready_prompt": True,
        "is_system": True,
    },
]


async def seed():
    async with async_session_factory() as db:
        for prompt_data in READY_PROMPTS:
            existing = await db.execute(
                __import__("sqlalchemy").select(PromptLibrary).where(
                    PromptLibrary.prompt_name == prompt_data["prompt_name"],
                    PromptLibrary.is_system == True,
                )
            )
            if not existing.scalar_one_or_none():
                prompt = PromptLibrary(prompt_id=uuid.uuid4(), **prompt_data)
                db.add(prompt)
        await db.commit()
        print(f"Seeded {len(READY_PROMPTS)} ready prompts.")


if __name__ == "__main__":
    asyncio.run(seed())

from . import register


@register("report_generator")
async def report_generator(config: dict, context: dict) -> dict:
    context["skill_instructions"] = (
        "Generate a structured report. Include: Executive Summary, Current Status, Key Milestones, "
        "Issues & Risks, Next Steps, and Recommendations. Use clear headings and bullet points."
    )
    context["response_format"] = "markdown"
    return context

from . import register


@register("pmo_analysis")
async def pmo_analysis(config: dict, context: dict) -> dict:
    context["rag_filters"] = context.get("rag_filters", {})
    context["rag_filters"]["domain_tags"] = ["PMO", "Project Management", "Governance"]
    context["skill_instructions"] = (
        "Apply PMO methodology. Evaluate project health, milestone adherence, resource allocation, "
        "and provide actionable recommendations aligned with PMBOK standards."
    )
    return context

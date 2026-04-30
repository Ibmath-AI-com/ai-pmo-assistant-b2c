from . import register


@register("risk_assessment")
async def risk_assessment(config: dict, context: dict) -> dict:
    context["rag_filters"] = context.get("rag_filters", {})
    context["rag_filters"]["domain_tags"] = ["Risk", "Governance", "Compliance"]
    context["skill_instructions"] = (
        "Identify and categorize risks using a 5x5 probability/impact matrix. "
        "For each risk provide: category, likelihood, impact, risk score, and PMI risk response strategy "
        "(Avoid/Transfer/Mitigate/Accept). Generate a RAID log if appropriate."
    )
    return context

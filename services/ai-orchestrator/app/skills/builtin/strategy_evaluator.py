from . import register


@register("strategy_evaluator")
async def strategy_evaluator(config: dict, context: dict) -> dict:
    context["rag_filters"] = context.get("rag_filters", {})
    context["rag_filters"]["domain_tags"] = ["Strategy", "KPI", "Balanced Scorecard"]
    context["skill_instructions"] = (
        "Apply balanced scorecard methodology. Evaluate across Financial, Customer, Internal Process, "
        "and Learning & Growth perspectives. Assess KPIs, identify gaps, and provide strategic recommendations."
    )
    return context

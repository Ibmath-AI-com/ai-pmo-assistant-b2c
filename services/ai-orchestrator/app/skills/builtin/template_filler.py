from . import register


@register("template_filler")
async def template_filler(config: dict, context: dict) -> dict:
    context["skill_instructions"] = (
        "Intelligently populate the template with relevant information. "
        "For any missing data fields, clearly mark them as [MISSING: field_name] and explain what information is needed. "
        "Maintain the template structure while filling in all available information."
    )
    return context

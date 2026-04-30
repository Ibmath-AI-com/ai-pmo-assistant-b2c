from . import register


@register("data_extractor")
async def data_extractor(config: dict, context: dict) -> dict:
    context["skill_instructions"] = (
        "Extract structured data from the provided text. "
        "Identify and organize: key entities, dates, metrics, decisions, action items, and owners. "
        "Present the extracted data in a structured, easy-to-read format."
    )
    context["response_format"] = "structured"
    return context

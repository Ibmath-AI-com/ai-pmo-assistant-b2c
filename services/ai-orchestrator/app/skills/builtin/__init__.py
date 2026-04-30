from typing import Callable

_REGISTRY: dict[str, Callable] = {}


def register(code: str):
    def decorator(fn):
        _REGISTRY[code] = fn
        return fn
    return decorator


def get_skill_handler(code: str) -> Callable | None:
    return _REGISTRY.get(code)


from . import pmo_analysis, risk_assessment, report_generator, strategy_evaluator, template_filler, data_extractor

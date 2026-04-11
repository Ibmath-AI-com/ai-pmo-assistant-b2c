import uuid
import pytest


@pytest.mark.asyncio
async def test_full_wizard_flow(client, make_user):
    """Complete 4-step persona creation wizard → GET returns everything nested."""

    # Step 1: Create basic persona
    step1 = await client.post("/api/v1/personas", json={
        "persona_code": "WIZ-01",
        "persona_name": "Wizard Persona",
        "persona_category": "Custom",
        "short_description": "Full wizard test persona",
    })
    assert step1.status_code == 201
    persona_id = step1.json()["persona_id"]

    # Step 2: Behavior
    step2 = await client.put(f"/api/v1/personas/{persona_id}/behavior", json={
        "system_instruction": "You help with project management.",
        "tone_of_voice": "Advisory",
        "response_format_preference": "Structured Report",
        "default_language": "en",
        "temperature": 0.7,
        "max_response_length": 2048,
    })
    assert step2.status_code == 200

    # Step 3: Model policy
    step3 = await client.put(f"/api/v1/personas/{persona_id}/model-policy", json={
        "chat_mode": "advisor",
        "use_rag": False,
        "use_internal_llm": True,
        "use_external_llm": False,
        "classification_limit": "Internal",
        "allow_file_upload": True,
        "allow_external_sources": False,
    })
    assert step3.status_code == 200

    # Step 4a: Access — use real user IDs so the user-existence check passes
    user_id_1 = await make_user()
    user_id_2 = await make_user()
    user_ids = [str(user_id_1), str(user_id_2)]
    step4a = await client.put(f"/api/v1/personas/{persona_id}/access", json={"user_ids": user_ids})
    assert step4a.status_code == 200

    # Step 4b: Domain tags
    step4b = await client.put(f"/api/v1/personas/{persona_id}/domain-tags", json={"tags": [
        {"tag_name": "PMO", "tag_type": "domain"},
        {"tag_name": "Scrum", "tag_type": "sdlc"},
    ]})
    assert step4b.status_code == 200

    # Final GET — all nested
    get_resp = await client.get(f"/api/v1/personas/{persona_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()

    assert data["persona_id"] == persona_id
    assert data["behavior_setting"]["tone_of_voice"] == "Advisory"
    assert data["behavior_setting"]["system_instruction"] == "You help with project management."
    assert data["model_policy"]["classification_limit"] == "Internal"
    assert len(data["access_roles"]) == 2
    assert len(data["domain_tags"]) == 2
    tag_names = {t["tag_name"] for t in data["domain_tags"]}
    assert "PMO" in tag_names
    assert "Scrum" in tag_names

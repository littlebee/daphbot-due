def pet_recognized(state_data):
    if "recognition" in state_data:
        for obj in state_data["recognition"]:
            if obj["classification"] in ["cat", "dog"]:
                return True
    return False

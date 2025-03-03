PET_LABELS = ["dog", "cat"]
TARGET_LABELS = [*PET_LABELS, "person"]


def find_primary_target(state_data):
    prime_target = None
    if "recognition" in state_data:
        for recog in state_data["recognition"]:
            if recog["classification"] in TARGET_LABELS:
                if prime_target is None:
                    prime_target = recog
                else:
                    print(f"comparing {recog=} {prime_target=}")
                    target_bb = prime_target["bounding_box"]
                    target_area = (target_bb[1] - target_bb[0]) * (
                        target_bb[3] - target_bb[2]
                    )

                    recog_bb = recog["bounding_box"]
                    recog_area = (recog_bb[1] - recog_bb[0]) * (
                        recog_bb[3] - recog_bb[2]
                    )
                    print(f"recog_area={recog_area} target_area={target_area}")
                    if recog_area > target_area:
                        prime_target = recog

    return prime_target


def is_pet(target):
    return target["classification"] in PET_LABELS

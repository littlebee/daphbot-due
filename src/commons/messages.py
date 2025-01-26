from basic_bot.commons import messages


async def send_behavior_state(websocket, is_dancing: bool):
    await messages.send_update_state(
        websocket, {"daphbot_behavior": {"is_dancing": is_dancing}}
    )

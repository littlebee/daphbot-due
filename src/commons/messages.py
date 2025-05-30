from basic_bot.commons import messages

last_primary_target_sent = None


async def send_primary_target(websocket, primary_target, force=False):
    """
    Send the primary target to the central hub if it has changed.
    """
    global last_primary_target_sent
    if not force and primary_target == last_primary_target_sent:
        return
    last_primary_target_sent = primary_target
    await messages.send_update_state(websocket, {"primary_target": primary_target})

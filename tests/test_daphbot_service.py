import time
import basic_bot.test_helpers.central_hub as hub
import basic_bot.test_helpers.start_stop as sss


def setup_module():
    # start the central hub and any other services needed to test your service
    sss.start_services(["-m basic_bot.services.central_hub", "src/daphbot_service.py"])

    # I needed to add this sleep to give the services time to start when running on
    # a Raspberry Pi4b w/4GB.  It is much slower starting daphbot_service.py than
    # on my Macbook Pro.  On the Pi4 it requires about 2 seconds for the service to
    # start and send it's update. On the CI/CD pipeline it requires about 4 seconds.
    # TODO : Find a better way to handle this. Maybe make it based on the cpu clock speed?
    time.sleep(10)


def teardown_module():
    sss.stop_services(["-m basic_bot.services.central_hub", "src/daphbot_service.py"])


PET_RECOGNIZED = {
    "recognition": [
        {
            "classification": "cat",
            "confidence": 0.9,
            "bounding_box": [0, 0, 0, 0],
        }
    ]
}


PERSON_RECOGNIZED = {
    "recognition": [
        {
            "classification": "person",
            "confidence": 0.9,
            "bounding_box": [0, 0, 0, 0],
        }
    ]
}


class TestDaphbotService:
    def test_daphbot_service(self):
        ws_mock_vision = hub.connect("test_daphbot_service:mock_vision_service")
        # the real vision_cv service would NOT subscribe to daphbot_behavior
        hub.send_subscribe(ws_mock_vision, ["daphbot_behavior"])

        # get the initial central hub state
        hub.send_get_state(ws_mock_vision, ["daphbot_behavior"])
        initial_state = hub.recv(ws_mock_vision)

        assert initial_state == {
            "type": "state",
            "data": {"daphbot_behavior": {"is_dancing": False}},
        }

        # send a message to the central hub to simulate a pet being detected
        # note that we don't have to start the basic_bot.services.vision_cv
        # service we are just pretending to be that service from here
        hub.send_update_state(ws_mock_vision, PET_RECOGNIZED)

        updated_state = hub.recv(ws_mock_vision)
        assert updated_state == {
            "type": "stateUpdate",
            "data": {"daphbot_behavior": {"is_dancing": True}},
        }

        # the service stubs this in test env to only last 0.5 seconds between
        # is_dancing being set from True to False

        # sleep a fraction of the time the dance should last
        time.sleep(0.1)
        # then send a recognition without any pets to prevent
        # the dance from being restarted
        hub.send_update_state(ws_mock_vision, PERSON_RECOGNIZED)

        updated_state = hub.recv(ws_mock_vision)
        assert updated_state == {
            "type": "stateUpdate",
            "data": {"daphbot_behavior": {"is_dancing": False}},
        }

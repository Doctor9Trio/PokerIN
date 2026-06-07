import asyncio
import random
import logging
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

class PokerBot:
    """
    Lightweight decision engine for server-side AI opponents.
    """
    def __init__(self, table_group_name, bot_user_id, seat_index):
        self.table_group_name = table_group_name
        self.bot_user_id = bot_user_id
        self.seat_index = seat_index
        self.channel_layer = get_channel_layer()

    async def decide_action(self, state, valid_actions, call_amount):
        """
        Evaluate table state and make a probabilistic decision.
        Triggers asynchronously to simulate human "thinking" time.
        """
        # Simulate human thinking time (1.5s to 3.5s)
        think_time = random.uniform(1.5, 3.5)
        await asyncio.sleep(think_time)

        # Basic probabilistic finite state machine
        action = "FOLD"
        amount = None

        if "CHECK" in valid_actions:
            # 80% Check, 20% Raise
            if random.random() < 0.2 and "RAISE" in valid_actions:
                action = "RAISE"
                amount = float(state.get('min_raise', 0))
            else:
                action = "CHECK"
        elif "CALL" in valid_actions:
            # 60% Call, 10% Raise, 30% Fold
            roll = random.random()
            if roll < 0.6:
                action = "CALL"
                amount = float(call_amount)
            elif roll < 0.7 and "RAISE" in valid_actions:
                action = "RAISE"
                amount = float(state.get('min_raise', 0))
            else:
                action = "FOLD"
        else:
            action = "FOLD"

        logger.info(f"Bot {self.bot_user_id} at seat {self.seat_index} decided to {action}.")

        # Emit action back to the consumer group
        await self.channel_layer.group_send(
            self.table_group_name,
            {
                "type": "handle_bot_action",
                "seat_index": self.seat_index,
                "action": action,
                "amount": amount
            }
        )

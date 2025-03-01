import time

from lib.renderables import Renderables


class SequencedRenderables(object):
    """
        SequencedRenderables is a wrapper around Renderables for renderable
        entities whose instantiation and close() is at timed intevals.

        Used like Renderables, you instantiate this class and then call it's
        append function to add renderable entities.

        Instead of passing renderable object instances, SequencedRenderables
        append takes an array of triplets consisting of

        [lead_in_time, time_to_live, function]

        Times are in seconds.

        Function may instantiate and return renderable entity when called or
        just return `None` if the function just needs to do a routine
        maintainence task.  Be aware that this function will be called during
        the render loop and could affect framerate performance.

        A time_to_live of zero indicates that the entity is not to be closed
        and removed until it either self destructs or the collection .close()
        is called.

        The triplets must be ordered in the array by lead_in_time ascending

        Example:

        renderables = SequencedRenderables()
        renderables.append([
            # Start with a text and start fading it out by calling close() on it in 20 secs
            [0, 20, lambda : FadeText(screen, 'this is my title', fade_out_duration=.5)]

            # After 15 seconds show a button for 30
            [15, 30, lambda : Button(screen, 'button lable', on_click=handle_click)]

            # After 45 seconds, do some routine maintance
            [45, 0, lambda : self.flush_toilet()]

        ])
    """

    def __init__(self):
        self.renderables = Renderables()

        # The sequence triplets passed to append
        self.sequenced_starts = []
        # our place in the current sequence
        self.sequenced_starts_index = 0

        # These are sequence tuples added as renderable entities are created
        # consisting of:
        #   [elapsed_time, lamda_to_call_close]
        self.sequenced_closings = []

        # time started
        self.started_at = time.time()

    def close(self):
        return self.renderables.close()

    def handle_pyg_event(self, event):
        return self.renderables.handle_pyg_event(event)

    def render(self, t):
        self.renderables.render(t)

        time_elapsed = time.time() - self.started_at
        if self.sequenced_starts_index < len(self.sequenced_starts):
            lead_in, ttl, fn = self.sequenced_starts[self.sequenced_starts_index]
            if time_elapsed > lead_in:
                ret = fn()
                poss_renderables = ret if hasattr(ret, "__len__") else [ret]
                for poss_renderable in poss_renderables:
                    if ttl > 0 and hasattr(poss_renderable, "close"):
                        self.sequenced_closings.append(
                            [lead_in + ttl, poss_renderable.close]
                        )
                    if hasattr(poss_renderable, "render"):
                        print(f"sequenced_renderables: adding renderable {poss_renderable} ")
                        self.renderables.append(poss_renderable)

                self.sequenced_starts_index += 1

        # Unlike the sequenced instantiations above, which are ordered by lead_in,
        # these could be in any order because TTL could be in any order
        closings_to_remove = []
        for closing in self.sequenced_closings:
            lead_in, closing_fn = closing
            if time_elapsed > lead_in:
                print(f"sequenced_renderable: closing {lead_in} {closing_fn}")
                closing_fn()
                closings_to_remove.append(closing)

        for closing in closings_to_remove:
            self.sequenced_closings.remove(closing)

    def remove(self, renderable):
        self.renderables.remove(renderable)

    def append(self, sequence):
        """ 
            sequence is one or array of sequenced items
        """
        if not hasattr(sequence, "__len__"):
            sequence = [sequence]

        self.sequenced_starts = self.sequenced_starts + sequence

    def inject(self, renderable):
        """
            Add renderable for immediate display, no TTL
        """
        self.renderables.append(renderable)
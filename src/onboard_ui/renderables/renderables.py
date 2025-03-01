class Renderables(object):
    """
    Renderables is a container for renderable entities.

    A renderable entity is a python object that has:

    - a `render` method (required).  `render` recieves one argument and should
      return `True` to indicate that it should continue to be called.  A non-truthy
      return will cause the Renderables container to remove the renderable
      item from being rendered.  It is passed the epoch time in seconds (time.time())
      for reliable animations.

    - a `handle_pyg_event` method (optional).  `handle_pyg_event` recieves one
      argument which is the PyGame event.  `handle_pyg_event` should return `True`
      to indicate that it has handled the event and earlier added renderables should
      not have their `handle_pyg_event` called.  In effect, returning false will
      stop propagation

    - a `close` method (optional).  After recieving close(), the renderable should
      return false from its `render` method to indicate it has closed.

    Note that by the above definition, `Renderables` container class defined herein
    is also a renderable entity.  Meaning you can have a renderable entity that is
    a composite from other renderable entities.
    """

    def __init__(self):
        self.renderables = []

    def close(self):
        for renderable in self.renderables[::-1]:
            if hasattr(renderable, "close"):
                renderable.close()

    def handle_pyg_event(self, event):
        # in reverse order so that later components can overlay previous added
        # and intercept the keyboard and mouse events by returning True.
        for renderable in self.renderables[::-1]:
            if hasattr(renderable, "handle_pyg_event"):
                if renderable.handle_pyg_event(event) == True:
                    return True

        return False

    def render(self, t):
        to_remove = []
        for renderable in self.renderables:
            # the renderable should return False if it is done rendering. Like
            # for example, if it is an animation that has completed or it was
            # a UI element that was closed by the user.
            if renderable.render(t) == False:
                to_remove.append(renderable)

        for renderable in to_remove:
            self.remove(renderable)

    def remove(self, renderable):
        self.renderables.remove(renderable)

    # renderable is one or array of renderable items
    def append(self, renderable):

        if not hasattr(renderable, "__len__"):
            renderables = [renderable]
        else:
            renderables = renderable

        for r in renderables:
            self.renderables.append(r) if r else None

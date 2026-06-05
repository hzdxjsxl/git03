class State:
    def __init__(self, name):
        self.name = name

    def enter(self, entity):
        pass

    def exit(self, entity):
        pass

    def update(self, entity, collision_system, entities):
        pass


class StateMachine:
    def __init__(self, initial_state):
        self.current_state = initial_state
        self.current_state.enter(None)

    def change_state(self, entity, new_state):
        self.current_state.exit(entity)
        self.current_state = new_state
        self.current_state.enter(entity)

    def update(self, entity, collision_system, entities):
        self.current_state.update(entity, collision_system, entities)

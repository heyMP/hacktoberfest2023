import { State, interpret } from "xstate";
import { machine } from '../machines/appMachine.js';
import hotkeys from 'hotkeys-js';

const URL_PARAMS = new URLSearchParams(window.location.search);

export class XstateController {
  host;
  machine = machine;
  interpretOptions = { devTools: true };
  state;
  actor;

  #interpretMachine() {
    if (this.actor?.initialized) {
      this.actor?.stop?.();
    }

    this.actor = interpret(this.machine, this.interpretOptions).onTransition(state => {
      this.state = state;
      this.host.requestUpdate();
      // update localstorage with the current state and context
      localStorage.setItem('app-state', JSON.stringify(state));
      console.log('Xstate', state.value, state);
    });

    if (URL_PARAMS.has('history')) {
      // get saved history
      const historyState = State.create(JSON.parse(localStorage.getItem('app-state')) || this.machine.initialState);
      // start the actor in the last saved state if available
      this.actor.start(historyState);
    }
    else {
      this.actor.start();
    }

    // add actor to the window for development
    window.actor = this.actor;
  }

  constructor(host) {
    (this.host = host).addController(this);

    hotkeys('cmd+b', () => {
      this.actor.send('back');
    });
  }

  updateMachine(machine) {
    this.machine = machine;
    this.#interpretMachine();
  }

  hostConnected() {
    this.#interpretMachine();
  }

  hostDisconnected() {
    this.actor?.stop?.();
  }
}


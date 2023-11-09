import { LitElement, html, css } from 'lit';
import '@rhds/elements/rh-cta/rh-cta.js';
import '@rhds/elements/rh-button/rh-button.js';
import '@rhds/elements/rh-spinner/rh-spinner.js';
import '@patternfly/elements/pf-modal/pf-modal.js';
import '@patternfly/elements/pf-progress-stepper/pf-progress-stepper.js'
import { XstateController } from './lib/machineController.js';
import { headerStyles } from './baseStyles.js';
import hotkeys from 'hotkeys-js';

// import './rh-ship-it-form.js';
import './components/rh-shipit-layout.js';

class RhShipIt extends LitElement {
  static styles = [
    headerStyles,
    css`
    .homepage-actions {
      justify-items: center;
      gap: 1em;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .image-library {
      display: flex;
      gap: 1em;
      flex-wrap: wrap;

      & img {
        width: 200px;
      }

      & input[name="image"] {
        position: fixed;
        opacity: 0;
        pointer-events: none;

        & ~ img {
          border: 3px solid transparent;
        }

        &:where(:checked,:hover,:focus) ~ img {
          border: 3px solid blue;
        }
      }
    }

    .image-preview {
      display: flex;
      gap: 1em;

      & img {
        max-width: 600px;
      }
    }

    .image-variants {
      display: flex;
      gap: .5em;
      align-items: flex-start;
      flex-wrap: wrap;
      align-content: flex-start;

      & img {
        max-width: 300px;
        display: block;
      }
    }

    .image-actions {
      display: flex;
      gap: .5em;
    }

    .image-creating-variants {
      & img {
        max-width: 300px;
      }
    }

    .image-editing {
      max-width: 1100px;
      margin-block: auto;

      & .images {
        display: flex;
        gap: 5em;
        justify-content: center;
      }

      & img {
        width: 400px;
      }

      .variants {
        display: flex;
        flex-wrap: wrap;
        gap: .5em;
        padding-block: 1em;

        & img {
          max-width: 200px;
        }
      }
    }

    .loading {
      position: fixed;
      display: flex;
      flex-direction: column;
      justify-content: center;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 100%;
      background: rgba(255,255,255, 0.8);
    }
  `];

  xstate = new XstateController(this);

  constructor() {
    super();

    hotkeys('command+x,command+c', (event, handler) => {
      const { state, actor } = this.xstate;
      if (state?.matches('imageLibrary')) {
        const selectedImage = this.shadowRoot.querySelector('form input[name="image"]:checked ~ img');
        if (selectedImage) {
          if (handler.key === 'command+x') {
            actor.send({ type: 'deleteImage', image: selectedImage.getAttribute('src') })
          }
          else if (handler.key === 'command+c') {
            actor.send({ type: 'customizeImage', image: { url: selectedImage.getAttribute('src') } })
          }
        }
      }
    });

    hotkeys('command+d', (event) => {
      event.preventDefault();
      console.log('delete')
      localStorage.removeItem('app-state');
      location.reload();
    });
  }

  render() {
    const { state, actor } = this.xstate;

    const ret = [];
    if (state?.matches('initial')) {
      ret.push(this.renderInitial());
    }
    else if (state?.matches('imageLibrary')) {
      ret.push(this.renderImageLibrary());
    }
    else if (state?.matches('imageService')) {
      if (state?.matches('imageService.prompt')) {
        ret.push(this.renderImagePrompt());
      }
      else if (state?.matches('imageService.generating')) {
        ret.push(this.renderImageGenerating());
      }
      else if (state?.matches('imageService.editing')) {
        ret.push(this.renderImageEditing());
      }
      else if (state?.matches('imageService.customizing')) {
        ret.push(this.renderImageCustomizing());
      }
    }

    return html`
      <rh-ship-it-layout>
        ${ret}
      </rh-ship-it-layout>
    `;
  }

  renderInitial() {
    const { state, actor } = this.xstate;
    return html`
      <div class="homepage-actions" style="">
        <rh-cta variant="secondary" @click=${() => actor.send('imageService')}>Generate Image</rh-cta>
        <rh-cta variant="secondary" @click=${() => actor.send('editImage')}>Edit Image</rh-cta>
        <rh-cta variant="secondary" @click=${() => actor.send('imageLibrary')}>Image Library</rh-cta>
      </div>
    `;
  }

  renderImageLibrary() {
    const { state, actor } = this.xstate;
    return html`
      <div class="image-library">
        <form>
          ${state.context?.imageLibrary?.map((image, index) => html`
            <label>
              <input type="radio" name="image">
              <img src=${image.url}>
            </label>
          `)}
        </form>
      </div>
    `;
  }

  renderImagePrompt() {
    const { state, actor } = this.xstate;
    return html`
      <form @submit=${this.#formSubmit}>
        <label for="prompt">Image Prompt</label>
        <input id="prompt" type="text" name="prompt">
        <rh-button type="submit">Submit</rh-button>
      </form>
    `;
  }

  renderImageGenerating() {
    const { state, actor } = this.xstate;
    return html`
      <rh-spinner class="loading">
        <div>Generating image...</div>
      </rh-spinner>
    `;
  }

  renderImageEditing() {
    const { state, actor } = this.xstate;
    const creatingEdits = state.matches('imageService.editing.creatingEdits')

    return html`
      <div class="image-editing">
        <h2>Edit Image</h2>
        <label for="prompt">Edit Prompt</label>
        <input id="prompt" type="text" name="prompt" @blur=${e => actor.send({ type: 'storePrompt', prompt: e.target.value })}>
        <rh-button @click=${() => actor.send('createEdits')} variant="tertiary">Create Edit</rh-button>
        <div class="images">
          <div class="source">
            <h3>Source</h3>
            <img src=${state.context?.imageEditConfig?.source}>
          </div>
          <div class="mask">
            <h3>Mask</h3>
            <img src=${state.context?.imageEditConfig?.mask}>
          </div>
        </div>
        <div class="variants">
          ${state?.context?.imageVariants?.map(image => html`
            <img src=${image?.url}>
          `)}
        </div>

        ${creatingEdits ? html`
         <rh-spinner class="loading">
            <div>Creating Edits</div>
          </rh-spinner>
        `: ''}
      </div>
    `;
  }

  renderImageCustomizing() {
    const { state, actor } = this.xstate;
    const creatingVariants = state.matches('imageService.customizing.creatingVariants')
    const choosingVariantAmount = state.matches('imageService.customizing.choosingVariantAmount')

    return html`
      <div class="image-preview">
        <div class="image-source">
          <img src=${state?.context?.image?.url}>
          <div class="image-actions">
            <rh-button @click=${() => actor.send('createPrompt')} variant="tertiary">Create new prompt</rh-button>
            <rh-button @click=${() => actor.send('createVariants')} variant="tertiary">Create variants</rh-button>
          </div>
        </div>
        <div class="image-variants">
          ${state?.context?.imageVariants?.map(image => html`
            <img src=${image?.url}>
          `)}
        </div>
      </div>
      ${creatingVariants ? html`
       <rh-spinner class="loading">
          <div>Creating Variants</div>
        </rh-spinner>
      `: ''}
      ${choosingVariantAmount ? html`
        <pf-modal trigger="choose-variant-amount" open @close=${() => actor.send('back')}>
          <h2 slot="header">Choose variant amount</h2>
          ${Array.from(Array(5)).map((_, index) => html`
            <rh-button @click=${() => actor.send({ type: 'chooseVariantAmaount', amount: index + 1 })}>${index + 1}</rh-button>
          `)}
       </pf-modal>
      `: ''}
    `;
  }

  renderImageCreatingVariants() {
    const { state, actor } = this.xstate;
    return html`
      <div class="image-creating-variants">
        <div>Creating Variants...</div>
        <img src=${state?.context?.image?.url}>
      </div>
    `;
  }

  #formSubmit(e) {
    const { state, actor } = this.xstate;
    e.preventDefault(e);
    const formData = new FormData(e.target);
    if (state.matches({ imageService: 'prompt' })) {
      actor.send('next', Object.fromEntries(formData.entries()));
    }
  }
}
close
customElements.define('rh-ship-it', RhShipIt);

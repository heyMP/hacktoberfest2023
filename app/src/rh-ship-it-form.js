import { LitElement, html, css } from 'lit';
// import '@rhds/elements';

import formStyles from './styles/forms.css' assert {type: 'css'};

class RhShipItForm extends LitElement {
  static properties = {
    pattern: { type: String },
    formData: { type: Object },
  }

  static styles = [
    formStyles,
    css`
      [part="base"] {
        padding: 1em;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1em;
      }
      [part="preview"] {
      }
    `
  ];

  constructor() {
    super();
    this.preview = 'card';
    this.formData = new FormData();
    this.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
    });
  }

  async fetchData() {
  }

  render() {
    console.log(this.formData, this.pattern)
    return html`
      <div part="base">
        <form @submit=${this._formSubmission}>
          <label for="title">Title</label>
          <input type="text" name="title"/>
          <label for="body">body</label>
          <textarea name="body"></textarea>
          <label for="cta">cta</label>
          <input type="text" name="cta"/>
          <label for="cta-href">cta-href</label>
          <input type="text" name="cta-href"/>
          <input type="submit"/>
        </form>
        <div part="preview">
          <label for="pattern">Select Pattern:</label>
          <select name="pattern" @change=${this._patternChange}>
            <option value="cta">CTA</option>
            <option value="card">Card</option>
          </select>

          ${this.renderPreview()}
        </div>
      </div>
    `
  }

  _formSubmission(e) {
    e.preventDefault();
    this.formData = new FormData(this.shadowRoot.querySelector('form'));
  }

  _patternChange() {
    this.pattern = this.shadowRoot.querySelector('select').value;
    console.log(this.pattern)
  }

  renderPreview() {
    if (this.pattern === 'card') {
      return html`
        <rh-card>
          <h2>${this.formData?.get('title')}</h2>
          <p>${this.formData?.get('body')}</p>
          <rh-cta priority="primary" slot="footer">
            <a href=${this.formData?.get('cta-href')}>${this.formData?.get('cta')}</a>
          </rh-cta>
        </rh-card>
      `
    }
    if (this.pattern === 'cta') {
      return html`
        <rh-cta priority="primary" slot="footer">
          <a href=${this.formdata?.get('cta-href')}>${this.formdata?.get('cta')}</a>
        </rh-cta>
      `
    }
    return ``;
  }
}

customElements.define('rh-ship-it-form', RhShipItForm);

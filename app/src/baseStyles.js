import { css } from 'lit';

export const headerStyles = css`
  :where(h1,h2,h3,h4) {
    font-family: var(--rh-font-family-heading, RedHatDisplay, 'Red Hat Display', 'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans Malayalam', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans Thai', Helvetica, Arial, sans-serif);
    font-weight: var(--rh-font-weight-heading-regular, 300);
  }

  h1 {
    font-size: var(--rh-font-size-heading-2xl, 3rem);
  }
  h2 {
    font-size: var(--rh-font-size-heading-xl, 2.5rem);
  }
  h3 {
    font-size: var(--rh-font-size-heading-lg, 2.25rem);
  }
`;

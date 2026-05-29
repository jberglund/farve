import { html } from "lit-html";

/**
 * A styled header bar for popovers. Includes an icon, title, and bottom border.
 *
 * Designed to sit inside a container with `p-m` padding — its negative margins
 * make it bleed to the edges for a full-width look.
 */
export function popoverHeader(title: string, iconHref = "#icon-info") {
  return html`
    <div class="border-bottom-default mb-xs mt--m mx--m px-m py-xs stack-horizontal gap-s">
      <svg class="tt-icon" viewBox="0 0 24 24"><use href="${iconHref}"></use></svg>
      <h5>${title}</h5>
    </div>
  `;
}

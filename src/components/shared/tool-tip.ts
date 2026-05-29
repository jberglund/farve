import { html } from "lit-html";
import { popoverHeader } from "./popover-header";

/**
 * Returns a `?` button and anchored popover. The popover's `id` must be unique
 * per page and is used to wire `popovertarget` ↔ `id`.
 *
 * Usage:
 *   ${toolTip("my-tip", "My Title", html`<p>Help text here.</p>`)}
 */
export function toolTip(id: string, title: string, content: unknown) {
  return html`
    <button class="tt-trigger" popovertarget="${id}">
      <svg class="tt-icon" viewBox="0 0 24 24"><use href="#icon-info"></use></svg>
    </button>
    <div
      id="${id}"
      class="tt-popover border-default surface-raised shadow-dialog mt-xs p-m br-m"
      popover
      role="tooltip"
    >
      ${popoverHeader(title)} ${content}
    </div>
  `;
}

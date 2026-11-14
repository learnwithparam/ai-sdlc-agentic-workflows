// A state is a page after the learner does something. The Kestrel map has no dialogs or forms.
import type { Page } from "@playwright/test";

export type PageState = { name: string; path: string; prepare: (page: Page) => Promise<void> };

export const states: PageState[] = [];

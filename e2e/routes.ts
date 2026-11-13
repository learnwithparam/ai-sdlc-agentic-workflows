// Every page a member can open on the Kestrel spoke. The audit visits each at 1280 px and 375 px.
export type Route = { name: string; path: string };

export const routes: Route[] = [{ name: "station map", path: "/" }];

// Button verbs this course uses beyond the shared list, in lower case.
export const extraButtonVerbs: string[] = [];

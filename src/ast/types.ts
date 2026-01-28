export type NodeKind =
  | "Element"
  | "Text"
  | "Comment"
  | "Attribute"
  | "Document";

export interface Node {
  readonly kind: NodeKind;
}

export interface Document extends Node {
  readonly kind: "Document";
}

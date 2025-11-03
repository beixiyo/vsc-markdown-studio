import { Parent as HASTParent } from 'hast';
/**
 * Rehype plugin which converts <span> elements with data-speaker-* attributes
 * to <speaker> tags as HTML text in Markdown export.
 */
export declare function convertSpeakerToTag(): (tree: HASTParent) => void;

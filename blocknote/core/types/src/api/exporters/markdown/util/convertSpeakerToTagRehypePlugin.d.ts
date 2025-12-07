import { Parent as HASTParent } from 'hast';
/**
 * @description 将 <span> 元素转换为 [speaker:originalLabel] 占位符格式
 */
export declare function convertSpeakerToTag(): (tree: HASTParent) => void;

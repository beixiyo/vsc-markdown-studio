import type { SuggestionState } from './types'
import { PluginKey } from '@tiptap/pm/state'

export const TRIGGER_EXTENSION_NAME = 'suggestionTrigger'
export const TRIGGER_PLUGIN_KEY = new PluginKey<SuggestionState>(TRIGGER_EXTENSION_NAME)

export const ERROR_EXTENSION_NOT_MOUNTED = 'SuggestionTriggerExtension is not mounted on this editor'
export const ERROR_EXTENSION_API_NOT_AVAILABLE = 'SuggestionTriggerExtension API is not available yet'

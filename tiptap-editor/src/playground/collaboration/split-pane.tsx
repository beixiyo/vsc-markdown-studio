'use client'

import { TiptapCollabProvider } from '@hocuspocus/provider'
import { memo, useState } from 'react'
import * as Y from 'yjs'
import { CollaborationEditor } from './editor'

/** 本地 Hocuspocus 服务器地址 */
const SERVER_URL = 'ws://localhost:8080'

const room = `room.${new Date()
  .getFullYear()
  .toString()
  .slice(-2)}${new Date().getMonth() + 1}${new Date().getDate()}-ok`

export const CollaborationSplitPane = memo(() => {
  // ydoc and provider for Editor A
  const [ydocA] = useState(() => new Y.Doc())
  const [providerA] = useState(() =>
    new TiptapCollabProvider({
      baseUrl: SERVER_URL,
      name: room,
      document: ydocA,
    }),
  )

  // ydoc and provider for Editor B
  const [ydocB] = useState(() => new Y.Doc())
  const [providerB] = useState(() =>
    new TiptapCollabProvider({
      baseUrl: SERVER_URL,
      name: room,
      document: ydocB,
    }),
  )

  return (
    <div className="flex flex-row h-screen overflow-hidden max-md:flex-col">
      <div className="flex flex-col flex-1 overflow-hidden">
        <CollaborationEditor provider={ providerA } ydoc={ ydocA } room={ room } />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden border-l border-border max-md:border-l-0 max-md:border-t max-md:border-border">
        <CollaborationEditor provider={ providerB } ydoc={ ydocB } room={ room } />
      </div>
    </div>
  )
})

CollaborationSplitPane.displayName = 'CollaborationSplitPane'

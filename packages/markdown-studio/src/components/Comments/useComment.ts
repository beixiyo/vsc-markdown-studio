import { DefaultThreadStoreAuth, YjsThreadStore } from '@blocknote/core/comments'
import { useYDoc, useYjsProvider } from '@y-sweet/react'
import { HARDCODED_USERS, type MyUserType } from './constans'

export function useComment() {
  const [activeUser, setActiveUser] = useState<MyUserType>(HARDCODED_USERS[0])

  const provider = useYjsProvider()
  const doc = useYDoc()

  const threadStore = useMemo(() => {
    return new YjsThreadStore(
      activeUser.id,
      doc.getMap('threads'),
      new DefaultThreadStoreAuth(activeUser.id, activeUser.role),
    )
  }, [doc, activeUser])

  return {
    activeUser,
    setActiveUser,
    threadStore,
    provider,
    doc,
  }
}

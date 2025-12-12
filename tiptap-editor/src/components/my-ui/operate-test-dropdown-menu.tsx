import { useMemo } from 'react'
import { ChevronDownIcon } from 'tiptap-styles/icons'
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Card,
  CardBody,
} from 'tiptap-styles/ui'

import type { OperateTestSuite } from '@/features/operate-tests'

type OperateTestDropdownMenuProps = {
  suites?: OperateTestSuite[]
  onRunAll?: () => void
  onRunSuite?: (suiteId: string) => void
  portal?: boolean
  disabled?: boolean
  running?: boolean
}

export function OperateTestDropdownMenu({
  suites = [],
  onRunAll,
  onRunSuite,
  portal = false,
  disabled = false,
  running = false,
}: OperateTestDropdownMenuProps) {
  const totalCases = useMemo(
    () => suites.reduce((acc, suite) => acc + (suite.cases?.length ?? 0), 0),
    [suites]
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          data-style="ghost"
          data-active-state={running ? 'on' : 'off'}
          role="button"
          tabIndex={-1}
          disabled={disabled || running}
          data-disabled={disabled || running}
          aria-label="Operate tests"
          tooltip="Operate tests"
        >
          <span className="tiptap-button-label">测试</span>
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" portal={portal}>
        <Card>
          <CardBody className="space-y-2">
            <ButtonGroup>
              <DropdownMenuItem
                asChild
                onSelect={event => {
                  event.preventDefault()
                  onRunAll?.()
                }}
              >
                <Button
                  type="button"
                  data-style="ghost"
                  className="justify-between"
                  disabled={disabled || running || totalCases === 0}
                >
                  运行全部
                  <span className="text-xs text-tiptap-muted">
                    { totalCases } 项
                  </span>
                </Button>
              </DropdownMenuItem>
            </ButtonGroup>

            <div className="flex flex-col gap-1">
              { suites.length === 0 ? (
                <div className="text-sm text-tiptap-muted px-2 py-1">
                  暂无测试用例
                </div>
              ) : (
                suites.map(suite => (
                  <DropdownMenuItem
                    key={suite.id}
                    className="cursor-pointer"
                    onSelect={event => {
                      event.preventDefault()
                      onRunSuite?.(suite.id)
                    }}
                    asChild
                  >
                    <Button
                      type="button"
                      data-style="ghost"
                      className="flex w-full items-center justify-between gap-3 px-2 py-1 text-left"
                    >
                      <span className="text-sm font-medium">{ suite.title }</span>
                      <span className="text-xs text-tiptap-muted">
                        { suite.cases?.length ?? 0 } 项
                      </span>
                    </Button>
                  </DropdownMenuItem>
                ))
              ) }
            </div>
          </CardBody>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}



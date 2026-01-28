import type { OperateTestSuite } from '@/features/operate-tests'
import {
  Button,
  ButtonGroup,
  Card,
  Popover,
  type PopoverRef,
} from 'comps'
import { useMemo, useRef } from 'react'

import { ChevronDownIcon } from 'tiptap-comps/icons'

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
  portal: _portal = false,
  disabled = false,
  running = false,
}: OperateTestDropdownMenuProps) {
  const popoverRef = useRef<PopoverRef>(null)
  const totalCases = useMemo(
    () => suites.reduce((acc, suite) => acc + (suite.cases?.length ?? 0), 0),
    [suites],
  )

  return (
    <Popover
      ref={ popoverRef }
      trigger="click"
      position="bottom"
      content={
        <Card className="p-2" shadow="md" padding="none">
          <div className="space-y-2">
            <ButtonGroup>
              <Button
                type="button"
                variant="ghost"
                className="justify-between"
                disabled={ disabled || running || totalCases === 0 }
                onClick={ () => {
                  onRunAll?.()
                  popoverRef.current?.close()
                } }
              >
                运行全部
                <span className="text-xs text-tiptap-muted">
                  { totalCases }
                  {' '}
                  项
                </span>
              </Button>
            </ButtonGroup>

            <div className="flex flex-col gap-1">
              { suites.length === 0
                ? (
                    <div className="text-sm text-tiptap-muted px-2 py-1">
                      暂无测试用例
                    </div>
                  )
                : (
                    suites.map(suite => (
                      <Button
                        key={ suite.id }
                        type="button"
                        variant="ghost"
                        className="flex w-full items-center justify-between gap-3 px-2 py-1 text-left"
                        onClick={ () => {
                          onRunSuite?.(suite.id)
                          popoverRef.current?.close()
                        } }
                      >
                        <span className="text-sm font-medium">{ suite.title }</span>
                        <span className="text-xs text-tiptap-muted">
                          { suite.cases?.length ?? 0 }
                          {' '}
                          项
                        </span>
                      </Button>
                    ))
                  ) }
            </div>
          </div>
        </Card>
      }
    >
      <Button
        type="button"
        variant="ghost"
        name={ running
          ? 'active'
          : undefined }
        role="button"
        tabIndex={ -1 }
        disabled={ disabled || running }
        aria-label="Operate tests"
        tooltip="Operate tests"
        size="sm"
      >
        <span className="tiptap-button-label">测试</span>
        <ChevronDownIcon className="size-4 text-icon" />
      </Button>
    </Popover>
  )
}

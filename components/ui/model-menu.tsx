'use client'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useModel } from '@/lib/hooks/use-model'
import { modelOptions } from '@/lib/constants'
import { CheckIcon } from '@radix-ui/react-icons'

export function ModelMenu() {
  const { model, setModel, setProvider, provider } = useModel()
  function onModelChange(model: string) {
    setModel(model)
    const newProvider = modelOptions.find(
      option => option.value === model
    )?.provider
    if (newProvider) {
      setProvider(newProvider)
    }
  }
  return (
    <div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="hover:bg-gray-100 hover:outline-none rounded-lg p-0 dark:bg-zinc-900 text-gray-700 focus:outline-none top-full">
          <div className="flex items-center w-full dark:bg-background cursor-pointer">
            {modelOptions.find(option => option.value === model)?.display}
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className="bg-white dark:bg-gray shadow-sm rounded-b-lg"
          align="start"
          sideOffset={12}
        >
          {modelOptions.map(option => (
            <DropdownMenu.Item
              key={option.value}
              className="flex items-center dark:bg-gray w-full hover:bg-gray-100 hover:outline-none cursor-pointer"
              onSelect={() => onModelChange(option.value)}
            >
              <div className="flex items-center w-full dark:bg-background">
                {option.display}
                {model === option.value && (
                  <CheckIcon className="ml-auto size-5 text-gray-500" />
                )}
              </div>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  )
}

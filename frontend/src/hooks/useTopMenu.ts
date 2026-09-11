import { useState } from 'react'

export type TopMenuType =
  | 'file'
  | 'edit'
  | 'view'
  | 'tools'
  | 'help'
  | null

export default function useTopMenu() {
  const [
    openTopMenu,
    setOpenTopMenu,
  ] = useState<TopMenuType>(null)

  const toggleTopMenu = (
    menu: Exclude<TopMenuType, null>,
  ) => {
    setOpenTopMenu((current) =>
      current === menu
        ? null
        : menu,
    )
  }

  const closeTopMenu = () => {
    setOpenTopMenu(null)
  }

  return {
    openTopMenu,
    toggleTopMenu,
    closeTopMenu,
  }
}
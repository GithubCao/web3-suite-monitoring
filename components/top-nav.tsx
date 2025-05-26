"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { WalletConnect } from "@/components/wallet-connect"
import { WalletSettingsDialog } from "@/components/wallet-settings-dialog"
import { Settings } from "lucide-react"

export function TopNav() {
  const [walletSettingsOpen, setWalletSettingsOpen] = useState(false)

  return (
    <div className="flex items-center justify-end p-4 border-b">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setWalletSettingsOpen(true)}>
          <Settings className="h-5 w-5" />
          <span className="sr-only">钱包设置</span>
        </Button>
        <WalletConnect />
        <WalletSettingsDialog open={walletSettingsOpen} onOpenChange={setWalletSettingsOpen} />
      </div>
    </div>
  )
}

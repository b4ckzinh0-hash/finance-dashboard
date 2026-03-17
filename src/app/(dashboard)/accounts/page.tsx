'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccounts } from '@/hooks/use-accounts'
import { formatCurrency } from '@/lib/utils'
import AccountList from '@/components/accounts/account-list'
import AccountModal from '@/components/accounts/account-modal'
import TransferModal from '@/components/accounts/transfer-modal'
import type { Account } from '@/types'

export default function AccountsPage() {
  const { totalBalance } = useAccounts()
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  function handleEdit(account: Account) {
    setEditingAccount(account)
    setAccountModalOpen(true)
  }

  function handleAdd() {
    setEditingAccount(null)
    setAccountModalOpen(true)
  }

  function handleCloseAccountModal() {
    setAccountModalOpen(false)
    setEditingAccount(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contas</h1>
          <p className="text-sm text-zinc-400">
            Saldo total: <span className="font-semibold text-violet-400">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => setTransferModalOpen(true)}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Transferência
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      <AccountList onEdit={handleEdit} onDelete={() => {}} />

      <AccountModal
        open={accountModalOpen}
        onClose={handleCloseAccountModal}
        editingAccount={editingAccount}
      />

      <TransferModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
      />
    </motion.div>
  )
}

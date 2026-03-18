'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'
import { NotificationSettings } from '@/components/notifications/notification-settings'

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleSaveProfile() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user?.id)
    setSaving(false)
    if (error) {
      toast({ title: 'Erro ao atualizar perfil', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: 'Perfil atualizado!' })
      setEditing(false)
    }
  }

  const initials = getInitials(profile?.full_name ?? user?.email ?? 'U')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl space-y-6"
    >
      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      {/* Profile */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Perfil</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-xl font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="font-medium text-white">{profile?.full_name ?? '—'}</p>
              <p className="text-sm text-zinc-400">{user?.email}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome completo</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button size="sm" variant="outline" className="border-zinc-700" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => { setFullName(profile?.full_name ?? ''); setEditing(true) }}>
              <User className="mr-2 h-4 w-4" />
              Editar perfil
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 space-y-3">
          <h2 className="text-lg font-semibold text-white">Preferências</h2>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
            <div>
              <p className="text-sm font-medium text-white">Moeda</p>
              <p className="text-xs text-zinc-400">Real Brasileiro (BRL)</p>
            </div>
            <span className="text-sm text-zinc-500 bg-zinc-800 px-2 py-1 rounded">BRL</span>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Notificações</h2>
          <NotificationSettings />
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Conta</h2>
          <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
          <div className="border-t border-zinc-800 pt-4">
            <p className="text-sm font-medium text-red-400 mb-2">Zona de perigo</p>
            <Button variant="outline" className="border-red-800 text-red-400 hover:bg-red-950" onClick={() => setDeleteOpen(true)}>
              Excluir conta
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-zinc-700" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => { toast({ title: 'Funcionalidade indisponível no momento.' }); setDeleteOpen(false) }}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCategories } from '@/hooks/use-categories'
import { useToast } from '@/components/ui/use-toast'
import { CATEGORY_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import IconPicker from './icon-picker'
import type { Category } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1, 'Selecione um ícone'),
  color: z.string(),
})

type FormData = z.infer<typeof schema>

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  editingCategory: Category | null
}

export default function CategoryModal({ open, onClose, editingCategory }: CategoryModalProps) {
  const { addCategory, updateCategory } = useCategories()
  const { toast } = useToast()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { name: '', type: 'expense', icon: '📦', color: CATEGORY_COLORS[0] },
    })

  const selectedColor = watch('color')
  const selectedType = watch('type')
  const selectedIcon = watch('icon')

  useEffect(() => {
    if (editingCategory) {
      reset({
        name: editingCategory.name,
        type: editingCategory.type,
        icon: editingCategory.icon,
        color: editingCategory.color,
      })
    } else {
      reset({ name: '', type: 'expense', icon: '📦', color: CATEGORY_COLORS[0] })
    }
  }, [editingCategory, reset, open])

  async function onSubmit(data: FormData) {
    const { error } = editingCategory
      ? await updateCategory(editingCategory.id, data)
      : await addCategory({ ...data, parent_id: null })

    if (error) {
      toast({ title: 'Erro ao salvar categoria', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: editingCategory ? 'Categoria atualizada!' : 'Categoria criada!' })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              {...register('name')}
              placeholder="Ex: Alimentação"
              className="bg-zinc-800 border-zinc-700"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Tabs value={selectedType} onValueChange={(v) => setValue('type', v as 'income' | 'expense')}>
              <TabsList className="bg-zinc-800 w-full">
                <TabsTrigger value="expense" className="flex-1">Despesa</TabsTrigger>
                <TabsTrigger value="income" className="flex-1">Receita</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <IconPicker value={selectedIcon} onChange={(icon) => setValue('icon', icon)} />
            {errors.icon && <p className="text-xs text-red-400">{errors.icon.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'h-6 w-6 rounded-full transition-all',
                    selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900',
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="border-zinc-700" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

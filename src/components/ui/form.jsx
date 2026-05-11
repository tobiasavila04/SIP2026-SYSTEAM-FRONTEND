import * as React from "react"
import { Slot } from "radix-ui"
import {
  Controller,
  FormProvider,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

const FormFieldContext = React.createContext({ name: "" })

function FormField({ ...props }) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
  }
}

const FormItemContext = React.createContext({ id: "" })

function FormItem({ className, ...props }) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}) {
  return (
    <Label
      data-slot="form-label"
      className={cn("text-sm font-medium text-slate-300", className)}
      {...props}
    />
  )
}

function FormControl({ ...props }) {
  return (
    <Slot.Slottable
      data-slot="form-control"
      {...props}
    />
  )
}

function FormDescription({ className, ...props }) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-sm text-slate-500", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }) {
  return (
    <p
      data-slot="form-message"
      className={cn("text-sm font-medium text-red-400", className)}
      {...props}
    />
  )
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
}

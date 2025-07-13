"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  disabled?: boolean
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  disabled,
}) => {
  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            onChange(e.target.result as string)
          }
        }
        reader.readAsDataURL(file)
      }
    },
    [onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-chiliz-primary transition-colors",
          isDragActive && "border-chiliz-primary bg-chiliz-primary/5",
          disabled && "cursor-not-allowed opacity-50",
          value && "border-solid border-gray-200"
        )}
      >
        <input {...getInputProps()} />
        
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt="Token image"
              className="h-32 w-32 rounded-lg object-cover mx-auto"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-chiliz-primary">
                Cliquez pour télécharger
              </span>
              {" ou glissez-déposez"}
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF jusqu'à 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export { ImageUpload } 
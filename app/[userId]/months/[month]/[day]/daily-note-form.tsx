"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, Save, Trash2, X, ZoomIn, LockIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DailyNoteFormProps {
  userId: string
  year: string
  month: string
  day: string
  isReadOnly?: boolean
}

interface Note {
  text: string
  images: string[]
  returnRate: string
  profitAmount: string
}

export default function DailyNoteForm({ userId, year, month, day, isReadOnly = false }: DailyNoteFormProps) {
  const [note, setNote] = useState<Note>({
    text: "",
    images: [],
    returnRate: "",
    profitAmount: "",
  })
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

  // 로컬 스토리지에서 노트 불러오기
  useEffect(() => {
    const key = `note-${userId}-${year}-${month}-${day}`
    const savedNote = localStorage.getItem(key)

    if (savedNote) {
      try {
        const parsedNote = JSON.parse(savedNote)
        setNote(parsedNote)
        setPreviewImages(parsedNote.images || [])
      } catch (error) {
        console.error("Failed to parse saved note:", error)
      }
    }
  }, [userId, year, month, day])

  // 노트 저장하기
  const saveNote = () => {
    if (isReadOnly) return

    const key = `note-${userId}-${year}-${month}-${day}`
    localStorage.setItem(key, JSON.stringify(note))
    alert("노트가 저장되었습니다.")
  }

  // 이미지 업로드 처리
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return

    if (e.target.files && e.target.files.length > 0) {
      const newImages: string[] = [...note.images]
      const newPreviews: string[] = [...previewImages]

      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader()

        reader.onload = (event) => {
          if (event.target && typeof event.target.result === "string") {
            newImages.push(event.target.result)
            newPreviews.push(event.target.result)

            setNote((prev) => ({
              ...prev,
              images: newImages,
            }))

            setPreviewImages(newPreviews)
          }
        }

        reader.readAsDataURL(file)
      })
    }
  }

  // 이미지 삭제
  const removeImage = (index: number) => {
    if (isReadOnly) return

    const newImages = [...note.images]
    const newPreviews = [...previewImages]

    newImages.splice(index, 1)
    newPreviews.splice(index, 1)

    setNote((prev) => ({
      ...prev,
      images: newImages,
    }))

    setPreviewImages(newPreviews)
  }

  // 이미지 확대 보기
  const openImageDialog = (image: string) => {
    setSelectedImage(image)
    setIsImageDialogOpen(true)
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>투기 노트</CardTitle>
          {isReadOnly && (
            <div className="flex items-center text-yellow-600">
              <LockIcon className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">읽기 전용</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">수익률 (%)</h3>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="float"
                  className={`w-full p-2 rounded-md border ${
                    Number.parseFloat(note.returnRate) > 0
                      ? "text-green-600 border-green-300"
                      : Number.parseFloat(note.returnRate) < 0
                        ? "text-red-600 border-red-300"
                        : "border-input"
                  }`}
                  value={note.returnRate}
                  onChange={(e) => setNote((prev) => ({ ...prev, returnRate: e.target.value }))}
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {Number.parseFloat(note.returnRate) > 0 && <span className="text-green-600">+</span>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">수익금액 ($)</h3>
              <div className="relative">
                <input
                  type="number"
                  placeholder="int"
                  className={`w-full p-2 rounded-md border ${
                    Number.parseFloat(note.profitAmount) > 0
                      ? "text-green-600 border-green-300"
                      : Number.parseFloat(note.profitAmount) < 0
                        ? "text-red-600 border-red-300"
                        : "border-input"
                  }`}
                  value={note.profitAmount}
                  onChange={(e) => setNote((prev) => ({ ...prev, profitAmount: e.target.value }))}
                  disabled={isReadOnly}
                  readOnly={isReadOnly}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {Number.parseFloat(note.profitAmount) > 0 && <span className="text-green-600">+</span>}
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">일지</h3>
            <Textarea
              placeholder="시장, 매매근거, 심리 등을 기록하세요"
              className="min-h-[200px]"
              value={note.text}
              onChange={(e) => setNote((prev) => ({ ...prev, text: e.target.value }))}
              disabled={isReadOnly}
              readOnly={isReadOnly}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">이미지</h3>
              {!isReadOnly && (
                <div>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isReadOnly}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      type="button"
                      asChild
                      disabled={isReadOnly}
                    >
                      <span>
                        <ImagePlus className="h-4 w-4 mr-2" />
                        이미지 추가
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {previewImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative cursor-pointer" onClick={() => openImageDialog(image)}>
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
                        <ZoomIn className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    {!isReadOnly && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-md text-muted-foreground">
                아직 첨부된 이미지가 없습니다.
              </div>
            )}
          </div>

          {!isReadOnly && (
            <Button className="w-full" onClick={saveNote}>
              <Save className="h-4 w-4 mr-2" />
              저장하기
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>이미지 보기</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="확대된 이미지"
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
          <div className="p-4 border-t flex justify-end">
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

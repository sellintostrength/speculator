"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImagePlus, Save, Trash2, X, ZoomIn, LockIcon, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClientSupabaseClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

interface DailyNoteFormProps {
  userId: string
  year: string
  month: string
  day: string
  isReadOnly?: boolean
}

interface Note {
  id?: string
  text: string
  returnRate: string
  profitAmount: string
}

export default function DailyNoteForm({ userId, year, month, day, isReadOnly = false }: DailyNoteFormProps) {
  const [note, setNote] = useState<Note>({
    text: "",
    returnRate: "",
    profitAmount: "",
  })
  const [images, setImages] = useState<{ id: string; url: string }[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClientSupabaseClient()

  // Supabase에서 노트 불러오기
  useEffect(() => {
    const fetchNote = async () => {
      try {
        setIsLoading(true)

        // 노트 데이터 가져오기
        const { data: noteData, error: noteError } = await supabase
          .from("investment_notes")
          .select("id, text, return_rate, profit_amount")
          .eq("user_id", userId)
          .eq("year", Number.parseInt(year))
          .eq("month", Number.parseInt(month))
          .eq("day", Number.parseInt(day))
          .single()

        if (noteError && noteError.code !== "PGRST116") {
          // PGRST116: 결과가 없음
          console.error("Failed to fetch note:", noteError)
          return
        }

        if (noteData) {
          setNote({
            id: noteData.id,
            text: noteData.text || "",
            returnRate: noteData.return_rate?.toString() || "",
            profitAmount: noteData.profit_amount?.toString() || "",
          })

          // 노트 이미지 가져오기
          const { data: imageData, error: imageError } = await supabase
            .from("note_images")
            .select("id, image_url")
            .eq("note_id", noteData.id)

          if (imageError) {
            console.error("Failed to fetch images:", imageError)
            return
          }

          if (imageData) {
            setImages(imageData.map((img) => ({ id: img.id, url: img.image_url })))
          }
        }
      } catch (error) {
        console.error("Error fetching note:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNote()
  }, [userId, year, month, day, supabase])

  // 노트 저장하기
  const saveNote = async () => {
    if (isReadOnly || isSaving) return

    try {
      setIsSaving(true)

      let noteId = note.id

      // 노트 저장 또는 업데이트
      if (noteId) {
        // 기존 노트 업데이트
        const { error } = await supabase
          .from("investment_notes")
          .update({
            text: note.text,
            return_rate: note.returnRate ? Number.parseFloat(note.returnRate) : null,
            profit_amount: note.profitAmount ? Number.parseFloat(note.profitAmount) : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", noteId)

        if (error) {
          console.error("Failed to update note:", error)
          alert("노트 업데이트에 실패했습니다.")
          return
        }
      } else {
        // 새 노트 생성
        const { data, error } = await supabase
          .from("investment_notes")
          .insert({
            user_id: userId,
            year: Number.parseInt(year),
            month: Number.parseInt(month),
            day: Number.parseInt(day),
            text: note.text,
            return_rate: note.returnRate ? Number.parseFloat(note.returnRate) : null,
            profit_amount: note.profitAmount ? Number.parseFloat(note.profitAmount) : null,
          })
          .select("id")
          .single()

        if (error) {
          console.error("Failed to create note:", error)
          alert("노트 생성에 실패했습니다.")
          return
        }

        noteId = data.id
        setNote((prev) => ({ ...prev, id: noteId }))
      }

      alert("노트가 저장되었습니다.")
    } catch (error) {
      console.error("Error saving note:", error)
      alert("노트 저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  // 이미지 업로드 처리
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly || !note.id) {
      alert("먼저 노트를 저장해주세요.")
      return
    }

    if (e.target.files && e.target.files.length > 0) {
      try {
        const file = e.target.files[0]
        const fileExt = file.name.split(".").pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `note-images/${note.id}/${fileName}`

        // Supabase Storage에 이미지 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("investment-notes")
          .upload(filePath, file)

        if (uploadError) {
          console.error("Image upload failed:", uploadError)
          alert("이미지 업로드에 실패했습니다.")
          return
        }

        // 이미지 URL 가져오기
        const { data: urlData } = supabase.storage.from("investment-notes").getPublicUrl(filePath)

        // 이미지 정보를 데이터베이스에 저장
        const { data: imageData, error: imageError } = await supabase
          .from("note_images")
          .insert({
            note_id: note.id,
            image_url: urlData.publicUrl,
          })
          .select("id")
          .single()

        if (imageError) {
          console.error("Failed to save image info:", imageError)
          alert("이미지 정보 저장에 실패했습니다.")
          return
        }

        // 이미지 목록 업데이트
        setImages((prev) => [...prev, { id: imageData.id, url: urlData.publicUrl }])
      } catch (error) {
        console.error("Error uploading image:", error)
        alert("이미지 업로드 중 오류가 발생했습니다.")
      }
    }
  }

  // 이미지 삭제
  const removeImage = async (id: string, url: string) => {
    if (isReadOnly) return

    try {
      // 스토리지에서 이미지 파일 삭제
      const filePath = url.split("/").pop()
      if (filePath) {
        await supabase.storage.from("investment-notes").remove([`note-images/${note.id}/${filePath}`])
      }

      // 데이터베이스에서 이미지 정보 삭제
      const { error } = await supabase.from("note_images").delete().eq("id", id)

      if (error) {
        console.error("Failed to delete image:", error)
        alert("이미지 삭제에 실패했습니다.")
        return
      }

      // 이미지 목록 업데이트
      setImages((prev) => prev.filter((img) => img.id !== id))
    } catch (error) {
      console.error("Error removing image:", error)
      alert("이미지 삭제 중 오류가 발생했습니다.")
    }
  }

  // 이미지 확대 보기
  const openImageDialog = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsImageDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>데이터 로딩 중...</p>
      </div>
    )
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
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isReadOnly || !note.id}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      type="button"
                      asChild
                      disabled={isReadOnly || !note.id}
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

            {images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="relative cursor-pointer" onClick={() => openImageDialog(image.url)}>
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt="투자 노트 이미지"
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
                        onClick={() => removeImage(image.id, image.url)}
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
            <Button className="w-full" onClick={saveNote} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  저장하기
                </>
              )}
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

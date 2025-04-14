"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, Trash2, FileText, Download, Eye, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import PdfViewer from "./pdf-viewer"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { v4 as uuidv4 } from "uuid"

interface ResourceFile {
  id: string
  name: string
  description: string
  created_at: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  uploader_name?: string
}

export default function ResourceLibrary() {
  const [resources, setResources] = useState<ResourceFile[]>([])
  const [newResource, setNewResource] = useState<{
    name: string
    description: string
    file: File | null
  }>({
    name: "",
    description: "",
    file: null,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [viewingResource, setViewingResource] = useState<ResourceFile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const supabase = createClientSupabaseClient()
  const { user } = useAuth()

  // Supabase에서 자료 불러오기
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true)

        // 자료 데이터 가져오기
        const { data, error } = await supabase
          .from("resources")
          .select("id, name, description, file_url, file_type, file_size, uploaded_by, created_at")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Failed to fetch resources:", error)
          return
        }

        if (data) {
          // 업로더 이름 가져오기
          const resourcesWithUploaderNames = await Promise.all(
            data.map(async (resource) => {
              const { data: userData } = await supabase
                .from("users")
                .select("name")
                .eq("id", resource.uploaded_by)
                .single()

              return {
                ...resource,
                uploader_name: userData?.name || "알 수 없음",
              }
            }),
          )

          setResources(resourcesWithUploaderNames)
        }
      } catch (error) {
        console.error("Error fetching resources:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResources()
  }, [supabase])

  // 파일 선택 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.type === "application/pdf") {
        setNewResource((prev) => ({
          ...prev,
          file,
        }))
      } else {
        alert("PDF 파일만 업로드 가능합니다.")
      }
    }
  }

  // 파일 업로드 처리
  const handleUpload = async () => {
    if (!newResource.file || !newResource.name || !user) {
      alert("파일과 이름을 입력해주세요.")
      return
    }

    setIsUploading(true)

    try {
      const file = newResource.file
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `resources/${fileName}`

      // Supabase Storage에 파일 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("investment-notes")
        .upload(filePath, file)

      if (uploadError) {
        console.error("File upload failed:", uploadError)
        alert("파일 업로드에 실패했습니다.")
        return
      }

      // 파일 URL 가져오기
      const { data: urlData } = supabase.storage.from("investment-notes").getPublicUrl(filePath)

      // 자료 정보를 데이터베이스에 저장
      const { data: resourceData, error: resourceError } = await supabase
        .from("resources")
        .insert({
          name: newResource.name,
          description: newResource.description || "",
          file_url: urlData.publicUrl,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.userId,
        })
        .select("id")
        .single()

      if (resourceError) {
        console.error("Failed to save resource info:", resourceError)
        alert("자료 정보 저장에 실패했습니다.")
        return
      }

      // 새로운 자료 목록 가져오기
      const { data: updatedResources, error: fetchError } = await supabase
        .from("resources")
        .select("id, name, description, file_url, file_type, file_size, uploaded_by, created_at")
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("Failed to fetch updated resources:", fetchError)
      } else if (updatedResources) {
        // 업로더 이름 가져오기
        const resourcesWithUploaderNames = await Promise.all(
          updatedResources.map(async (resource) => {
            const { data: userData } = await supabase
              .from("users")
              .select("name")
              .eq("id", resource.uploaded_by)
              .single()

            return {
              ...resource,
              uploader_name: userData?.name || "알 수 없음",
            }
          }),
        )

        setResources(resourcesWithUploaderNames)
      }

      // 폼 초기화
      setNewResource({
        name: "",
        description: "",
        file: null,
      })

      // 파일 입력 필드 초기화
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      alert("자료가 성공적으로 업로드되었습니다.")
    } catch (error) {
      console.error("Error uploading file:", error)
      alert("파일 업로드 중 오류가 발생했습니다.")
    } finally {
      setIsUploading(false)
    }
  }

  // 자료 삭제
  const handleDelete = async (id: string, fileUrl: string) => {
    if (!user || !window.confirm("정말로 이 자료를 삭제하시겠습니까?")) {
      return
    }

    try {
      // 스토리지에서 파일 삭제
      const filePath = fileUrl.split("/").pop()
      if (filePath) {
        await supabase.storage.from("investment-notes").remove([`resources/${filePath}`])
      }

      // 데이터베이스에서 자료 정보 삭제
      const { error } = await supabase.from("resources").delete().eq("id", id)

      if (error) {
        console.error("Failed to delete resource:", error)
        alert("자료 삭제에 실패했습니다.")
        return
      }

      // 자료 목록 업데이트
      setResources((prev) => prev.filter((resource) => resource.id !== id))
      alert("자료가 삭제되었습니다.")
    } catch (error) {
      console.error("Error deleting resource:", error)
      alert("자료 삭제 중 오류가 발생했습니다.")
    }
  }

  // 자료 보기
  const handleView = (resource: ResourceFile) => {
    setViewingResource(resource)
    setIsDialogOpen(true)
  }

  // 자료 다운로드
  const handleDownload = (resource: ResourceFile) => {
    window.open(resource.file_url, "_blank")
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">자료 목록</TabsTrigger>
          <TabsTrigger value="upload">자료 업로드</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {resources.length > 0 ? (
            <div className="grid gap-4">
              {resources.map((resource) => (
                <Card key={resource.id} className="w-full">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{resource.name}</CardTitle>
                        <CardDescription>
                          업로드: {formatDate(resource.created_at)} | 크기: {formatFileSize(resource.file_size)} |
                          업로더: {resource.uploader_name}
                        </CardDescription>
                      </div>
                      {user && user.userId === resource.uploaded_by && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(resource.id, resource.file_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{resource.description || "설명 없음"}</p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(resource)}>
                      <Eye className="h-4 w-4 mr-2" />
                      보기
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(resource)}>
                      <Download className="h-4 w-4 mr-2" />
                      다운로드
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-10">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  아직 업로드된 자료가 없습니다. '자료 업로드' 탭에서 PDF 파일을 업로드해보세요.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>PDF 자료 업로드</CardTitle>
              <CardDescription>투자 관련 PDF 자료를 업로드하고 관리하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resource-name">자료 이름</Label>
                <Input
                  id="resource-name"
                  placeholder="자료 이름을 입력하세요"
                  value={newResource.name}
                  onChange={(e) => setNewResource((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-description">자료 설명 (선택사항)</Label>
                <Input
                  id="resource-description"
                  placeholder="자료에 대한 설명을 입력하세요"
                  value={newResource.description}
                  onChange={(e) => setNewResource((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload">PDF 파일</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
                {newResource.file && (
                  <p className="text-sm text-muted-foreground">
                    선택된 파일: {newResource.file.name} ({formatFileSize(newResource.file.size)})
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={isUploading || !newResource.file || !newResource.name}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4 mr-2" />
                    자료 업로드
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-4">
          <DialogHeader>
            <DialogTitle>{viewingResource?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {viewingResource && <PdfViewer pdfData={viewingResource.file_url} fileName={viewingResource.name} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

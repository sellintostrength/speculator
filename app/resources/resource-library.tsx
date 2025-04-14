"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, Trash2, FileText, Download, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import PdfViewer from "./pdf-viewer"

interface ResourceFile {
  id: string
  name: string
  description: string
  date: string
  fileData: string
  fileType: string
  fileSize: number
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
  const [viewingResource, setViewingResource] = useState<ResourceFile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 로컬 스토리지에서 자료 불러오기
  useEffect(() => {
    const savedResources = localStorage.getItem("pdf-resources")
    if (savedResources) {
      try {
        setResources(JSON.parse(savedResources))
      } catch (error) {
        console.error("Failed to parse saved resources:", error)
      }
    }
  }, [])

  // 자료 저장하기
  const saveResources = (updatedResources: ResourceFile[]) => {
    localStorage.setItem("pdf-resources", JSON.stringify(updatedResources))
    setResources(updatedResources)
  }

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
    if (!newResource.file || !newResource.name) {
      alert("파일과 이름을 입력해주세요.")
      return
    }

    setIsUploading(true)

    try {
      // 파일을 base64로 인코딩
      const fileData = await readFileAsDataURL(newResource.file)

      const newResourceItem: ResourceFile = {
        id: Date.now().toString(),
        name: newResource.name,
        description: newResource.description,
        date: new Date().toISOString(),
        fileData,
        fileType: newResource.file.type,
        fileSize: newResource.file.size,
      }

      const updatedResources = [...resources, newResourceItem]
      saveResources(updatedResources)

      // 폼 초기화
      setNewResource({
        name: "",
        description: "",
        file: null,
      })

      // 파일 입력 필드 초기화
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      console.error("Failed to upload file:", error)
      alert("파일 업로드에 실패했습니다.")
    } finally {
      setIsUploading(false)
    }
  }

  // 파일을 base64로 읽기
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result)
        } else {
          reject(new Error("Failed to read file as data URL"))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  // 자료 삭제
  const handleDelete = (id: string) => {
    if (window.confirm("정말로 이 자료를 삭제하시겠습니까?")) {
      const updatedResources = resources.filter((resource) => resource.id !== id)
      saveResources(updatedResources)
    }
  }

  // 자료 보기
  const handleView = (resource: ResourceFile) => {
    setViewingResource(resource)
    setIsDialogOpen(true)
  }

  // 자료 다운로드
  const handleDownload = (resource: ResourceFile) => {
    const link = document.createElement("a")
    link.href = resource.fileData
    link.download = resource.name + ".pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
                          업로드: {formatDate(resource.date)} | 크기: {formatFileSize(resource.fileSize)}
                        </CardDescription>
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(resource.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                  "업로드 중..."
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
            {viewingResource && <PdfViewer pdfData={viewingResource.fileData} fileName={viewingResource.name} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

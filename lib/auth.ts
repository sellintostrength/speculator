// 사용자 인증 관련 유틸리티 함수

export interface User {
  id: string // 전화번호 마지막 4자리
  username: string // 이메일
  password: string // 전화번호 마지막 4자리
  name: string
  email: string
  phone: string
}

// 초기 사용자 설정
export const setupInitialUsers = () => {
  const users = localStorage.getItem("users")
  if (!users) {
    const initialUsers: User[] = [
      {
        id: "1234", // 전화번호 마지막 4자리
        username: "kim@example.com", // 이메일
        password: "1234", // 전화번호 마지막 4자리
        name: "김형석",
        email: "kim@example.com",
        phone: "010-1234-1234",
      },
      {
        id: "5678", // 전화번호 마지막 4자리
        username: "ko@example.com", // 이메일
        password: "5678", // 전화번호 마지막 4자리
        name: "고지웅",
        email: "ko@example.com",
        phone: "010-1234-5678",
      },
    ]
    localStorage.setItem("users", JSON.stringify(initialUsers))
  }
}

// 사용자 로그인
export const loginUser = (username: string, password: string): User | null => {
  const users = JSON.parse(localStorage.getItem("users") || "[]") as User[]
  const user = users.find((u) => u.username === username && u.password === password)

  if (user) {
    // 사용자 세션 저장
    const session = {
      userId: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    }
    localStorage.setItem("session", JSON.stringify(session))
    return user
  }

  return null
}

// 현재 로그인한 사용자 가져오기
export const getCurrentUser = () => {
  const session = localStorage.getItem("session")
  if (!session) return null

  try {
    return JSON.parse(session)
  } catch (error) {
    console.error("Failed to parse session:", error)
    return null
  }
}

// 로그아웃
export const logoutUser = () => {
  localStorage.removeItem("session")
}

// 사용자 권한 확인
export const checkUserPermission = (userId: string, resourceUserId: string) => {
  return userId === resourceUserId
}

// 새 사용자 추가 (관리자용)
export const addUser = (name: string, email: string, phone: string): boolean => {
  try {
    const users = JSON.parse(localStorage.getItem("users") || "[]") as User[]

    // 이메일 중복 확인
    if (users.some((user) => user.username === email)) {
      return false
    }

    // 전화번호에서 마지막 4자리 추출
    const last4Digits = phone.replace(/[^0-9]/g, "").slice(-4)

    const newUser: User = {
      id: last4Digits,
      username: email,
      password: last4Digits,
      name,
      email,
      phone,
    }

    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))
    return true
  } catch (error) {
    console.error("Failed to add user:", error)
    return false
  }
}

// 사용자 ID로 사용자 정보 가져오기
export const getUserById = (userId: string): { name: string; email: string } | null => {
  try {
    const users = JSON.parse(localStorage.getItem("users") || "[]") as User[]
    const user = users.find((u) => u.id === userId)

    if (user) {
      return {
        name: user.name,
        email: user.email,
      }
    }

    return null
  } catch (error) {
    console.error("Failed to get user by ID:", error)
    return null
  }
}

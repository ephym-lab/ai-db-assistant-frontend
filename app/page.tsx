"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { fakeAuth } from "@/lib/fakeAuth"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (fakeAuth.isAuthenticated()) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }, [router])

  return null
}

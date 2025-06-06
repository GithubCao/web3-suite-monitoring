"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface Strategy {
  id: string
  name: string
  description: string
  content: string
}

const EditStrategyPage = () => {
  const router = useRouter()
  const params = useParams()
  const strategyId = params.id as string

  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStrategy = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/strategies/${strategyId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch strategy: ${response.status}`)
        }
        const data = await response.json()
        setStrategy(data)
        setName(data.name)
        setDescription(data.description)
        setContent(data.content)
      } catch (error: any) {
        console.error("Error fetching strategy:", error)
        toast.error(`Error fetching strategy: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (strategyId) {
      fetchStrategy()
    }
  }, [strategyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch(`/api/strategies/${strategyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          content,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update strategy: ${response.status}`)
      }

      toast.success("Strategy updated successfully!")
      router.push("/strategies")
    } catch (error: any) {
      console.error("Error updating strategy:", error)
      toast.error(`Error updating strategy: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!strategy) {
    return <div>Strategy not found.</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Strategy</CardTitle>
          <CardDescription>Edit the strategy details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} required />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Strategy"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default EditStrategyPage

import { DatabaseInitAlert } from "@/components/database-init-alert"

export default function Page() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <DatabaseInitAlert />
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">CTS v3.1</h1>
        <p className="text-lg text-gray-600">Development Preview</p>
        <p className="text-sm text-gray-500 mt-4">Building incrementally to identify issues</p>
      </div>
    </main>
  )
}

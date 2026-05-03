'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { LeadIntake } from '@/components/lead-intake'
import { Monitor } from '@/components/monitor'
import { Clipboard, Eye } from 'lucide-react'

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState('intake')

  const handleLeadAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clipboard className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">
              Lead Dispatcher
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Eye World Hospital
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 m-4 bg-muted">
            <TabsTrigger
              value="intake"
              className="data-[state=active]:bg-background"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Lead Intake</span>
              <span className="sm:hidden">Intake</span>
            </TabsTrigger>
            <TabsTrigger
              value="monitor"
              className="data-[state=active]:bg-background"
            >
              <Eye className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Monitor</span>
              <span className="sm:hidden">Monitor</span>
            </TabsTrigger>
          </TabsList>

          <div className="px-4 py-4">
            <TabsContent value="intake">
              <LeadIntake onLeadAdded={handleLeadAdded} />
            </TabsContent>

            <TabsContent value="monitor">
              <Monitor refreshTrigger={refreshTrigger} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer spacing for mobile */}
      <div className="h-8" />
    </main>
  )
}

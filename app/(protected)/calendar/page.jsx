"use client"

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Teamup Calendar</h1>
          <p className="text-slate-600">View and manage your schedule with Teamup</p>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-0 h-full w-full">
          <iframe
            src="https://teamup.com/c/24quxn/my-hope-housing"
            width="100%"
            height="100%"
            frameBorder="0"
            className="rounded-b-lg h-full min-h-[600px]"
            title="Teamup Calendar"
          ></iframe>
        </CardContent>
      </Card>
    </div>
  );
}

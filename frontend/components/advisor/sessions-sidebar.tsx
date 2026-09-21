"use client";

import React from "react";
import { Plus, MessageSquare, Trash2, Edit2, Check, X, Box, Sparkles, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Session {
  id: string;
  name: string;
  messages: { role: "user" | "ai"; text: string }[];
  createdAt: number;
}

interface SessionsSidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  editingSessionId: string | null;
  editingName: string;
  setEditingName: (name: string) => void;
  onStartRename: (session: Session, e: React.MouseEvent) => void;
  onCommitRename: (id: string) => void;
  onCancelRename: () => void;
  isOpen: boolean;
  onToggle: () => void;
  inventoryCount: number;
  onOpenInventory: () => void;
}

export function SessionsSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  editingSessionId,
  editingName,
  setEditingName,
  onStartRename,
  onCommitRename,
  onCancelRename,
  isOpen,
  onToggle,
  inventoryCount,
  onOpenInventory,
}: SessionsSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-72 bg-white border-r border-slate-200/90 flex flex-col h-full flex-shrink-0 z-20 shadow-sm transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#4C7359]/10 border border-[#4C7359]/20 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-[#4C7359]" />
          </div>
          <span className="font-semibold text-sm text-slate-800">Consultations</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* New Consultation Button */}
      <div className="p-3">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-[#4C7359]/40 bg-[#4C7359]/5 hover:bg-[#4C7359]/10 text-[#3E6049] font-medium text-xs transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="h-3.5 w-3.5" />
          New Consultation
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 py-1">
        <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 px-2 py-1">
          Recent Consultations ({sessions.length}/10)
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No previous sessions.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = session.id === editingSessionId;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#4C7359] rounded-r-full" />
                )}

                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-[#4C7359]" : "text-slate-400"}`} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onCommitRename(session.id);
                        if (e.key === "Escape") onCancelRename();
                      }}
                      className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 w-full focus:outline-none focus:border-[#4C7359]"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate">{session.name}</span>
                  )}
                </div>

                {/* Hover Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCommitRename(session.id);
                        }}
                        className="p-1 hover:text-emerald-600"
                        title="Save name"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelRename();
                        }}
                        className="p-1 hover:text-slate-600"
                        title="Cancel"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => onStartRename(session, e)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded"
                        title="Rename"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => onDeleteSession(session.id, e)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: User Wardrobe / Inventory */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={onOpenInventory}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-amber-600" />
            <span>My Skincare Wardrobe</span>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {inventoryCount} items
          </Badge>
        </button>
      </div>
    </aside>
  );
}

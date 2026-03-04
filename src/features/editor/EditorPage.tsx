"use client";

import { AdminPage } from "@/features/admin/AdminPage";
import { Agencia } from "@/types";

interface EditorPageProps {
  agencias: Agencia[];
}

export function EditorPage(_props: EditorPageProps) {
  return <AdminPage variant="editor" />;
}


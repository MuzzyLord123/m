
-- Platform files: unified reference table for all app files saved to OneDrive/Files
CREATE TABLE public.platform_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'website', 'cad_project', 'pdf', 'document', 'spreadsheet', 'presentation', 'notebook', 'design', 'whiteboard', 'poll', 'task'
  app_source TEXT NOT NULL, -- 'workshop', 'cad-studio', 'pdf-studio', 'docs', 'sheets', 'slides', 'notes', 'design-studio', 'whiteboard', 'polls', 'tasks'
  source_id TEXT, -- ID of the original item in its source table (e.g., designer_sites.id, cad_projects.id)
  source_route TEXT, -- The route to open this item in its source app
  folder_path TEXT NOT NULL DEFAULT '/', -- Folder path within the Files system
  description TEXT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}', -- extra info (page count, word count, etc.)
  file_size_bytes BIGINT DEFAULT 0,
  is_starred BOOLEAN NOT NULL DEFAULT false,
  is_trashed BOOLEAN NOT NULL DEFAULT false,
  trashed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Folders for organizing platform files
CREATE TABLE public.platform_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  folder_name TEXT NOT NULL,
  parent_path TEXT NOT NULL DEFAULT '/',
  full_path TEXT NOT NULL, -- e.g., '/Projects/Web'
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, full_path)
);

-- Enable RLS
ALTER TABLE public.platform_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies using is_owner
CREATE POLICY "Users can view own platform files" ON public.platform_files FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can insert own platform files" ON public.platform_files FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own platform files" ON public.platform_files FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own platform files" ON public.platform_files FOR DELETE USING (public.is_owner(user_id));

CREATE POLICY "Users can view own folders" ON public.platform_folders FOR SELECT USING (public.is_owner(user_id));
CREATE POLICY "Users can insert own folders" ON public.platform_folders FOR INSERT WITH CHECK (public.is_owner(user_id));
CREATE POLICY "Users can update own folders" ON public.platform_folders FOR UPDATE USING (public.is_owner(user_id));
CREATE POLICY "Users can delete own folders" ON public.platform_folders FOR DELETE USING (public.is_owner(user_id));

-- Indexes
CREATE INDEX idx_platform_files_user ON public.platform_files(user_id);
CREATE INDEX idx_platform_files_type ON public.platform_files(file_type);
CREATE INDEX idx_platform_files_folder ON public.platform_files(folder_path);
CREATE INDEX idx_platform_files_source ON public.platform_files(app_source, source_id);
CREATE INDEX idx_platform_folders_user ON public.platform_folders(user_id);
CREATE INDEX idx_platform_folders_path ON public.platform_folders(user_id, parent_path);

-- Trigger for updated_at
CREATE TRIGGER update_platform_files_updated_at BEFORE UPDATE ON public.platform_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_folders_updated_at BEFORE UPDATE ON public.platform_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

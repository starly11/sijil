import { 
  LayoutDashboard, 
  AlertTriangle, 
  Loader2, 
  Layers, 
  FileText, 
  GraduationCap, 
  BookOpen 
} from 'lucide-react';

export const Icons = {
  Dashboard: LayoutDashboard,
  Warning: AlertTriangle,
  Spinner: Loader2,
  Topics: Layers,
  Documents: FileText,
  Grades: GraduationCap,
  Subjects: BookOpen,
} as const;
